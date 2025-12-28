import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  calledSeekerSwords?: boolean;
  seekerSwords?: string[];
  splitterDist?: number;
  seenFeralHowl?: boolean;
  seenSecretsRevealed?: boolean;
  reversalOfForces?: boolean;
  weaveMiasmaCount?: number;
  avowedTemperature?: number;
  unseenIds?: number[];
  unseenBadRows?: number[];
  unseenBadCols?: number[];
  seenHeavensWrath?: boolean;
}

// TODO: warnings for mines after bosses?

const seekerCenterX = -0.01531982;
const seekerCenterY = 277.9735;

const avowedCenterX = -272;
const avowedCenterY = -82;

// TODO: promote something like this to Conditions?
const tankBusterOnParty = (data: Data, matches: NetMatches['StartsUsing']) => {
  if (matches.target === data.me)
    return true;
  if (data.role !== 'healer')
    return false;
  return data.party.inParty(matches.target);
};

const triggerSet: TriggerSet<Data> = {
  id: 'DelubrumReginae',
  zoneId: ZoneId.DelubrumReginae,
  timelineFile: 'delubrum_reginae.txt',
  triggers: [
    // *** Trinity Seeker ***
    {
      id: 'Delubrum Seeker Verdant Tempest',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5AB6', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Seeker Sword Cleanup',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5B5D', capture: false },
      run: (data) => {
        delete data.calledSeekerSwords;
        delete data.seekerSwords;
      },
    },
    {
      id: 'Delubrum Seeker Mercy Swords',
      type: 'GainsEffect',
      netRegex: { target: ['Trinity Seeker', 'Seeker Avatar'], effectId: '808' },
      durationSeconds: 10,
      alertText: (data, matches, output) => {
        if (data.calledSeekerSwords)
          return;

        data.seekerSwords ??= [];
        data.seekerSwords.push(matches.count.toUpperCase());

        if (data.seekerSwords.length <= 1)
          return;

        const cleaves = data.seekerSwords;

        // Seen two cleaves, is this enough information to call??
        // If no, we will wait until we have seen the third.
        if (data.seekerSwords.length === 2) {
          // Named constants for readability.
          const dir = { north: 0, east: 1, south: 2, west: 3 };

          // Find boss-relative safe zones.
          const cleavetoSafeZones: { [cleave: string]: number[] } = {
            // Front right cleave.
            F7: [dir.south, dir.west],
            // Back right cleave.
            F8: [dir.west, dir.north],
            // Front left cleave.
            F9: [dir.east, dir.south],
            // Back left cleave.
            FA: [dir.north, dir.east],
          };

          const cleave0 = cleaves[0];
          const cleave1 = cleaves[1];
          if (cleave0 === undefined || cleave1 === undefined)
            throw new UnreachableCode();
          const first = cleavetoSafeZones[cleave0];
          const second = cleavetoSafeZones[cleave1];
          if (first === undefined || second === undefined)
            throw new UnreachableCode();

          const intersect = first.filter((safe) => second.includes(safe));
          if (intersect.length === 2) {
            console.error(`Sword: weird intersect: ${JSON.stringify(data.seekerSwords)}`);
            return;
          }
          // This is a bad pattern.  Need to wait for three swords.
          if (intersect.length === 0)
            return;

          data.calledSeekerSwords = true;
          const cardinal = intersect[0];
          if (cardinal === dir.north)
            return output.double!({ dir1: output.north!(), dir2: output.south!() });
          if (cardinal === dir.east)
            return output.double!({ dir1: output.east!(), dir2: output.west!() });
          if (cardinal === dir.south)
            return output.double!({ dir1: output.south!(), dir2: output.north!() });
          if (cardinal === dir.west)
            return output.double!({ dir1: output.west!(), dir2: output.east!() });
          // Or not?
          data.calledSeekerSwords = false;
          return;
        }

        const cleaveToDirection: { [cleave: string]: string } = {
          // Front right cleave.
          F7: output.west!(),
          // Back right cleave.
          F8: output.west!(),
          // Front left cleave.
          F9: output.east!(),
          // Back left cleave.
          FA: output.east!(),
        };

        // Seen three clones, which means we weren't able to call with two.
        // Try to call out something the best we can.
        // Find the cleave we're missing and add it to the list.
        const allCleaveKeys = Object.keys(cleaveToDirection);
        const finalCleaveList = allCleaveKeys.filter((id) => !cleaves.includes(id));
        const finalCleave = finalCleaveList[0];
        if (finalCleave === undefined || finalCleaveList.length !== 1) {
          console.error(`Swords: bad intersection ${JSON.stringify(data.seekerSwords)}`);
          return;
        }
        cleaves.push(finalCleave);

        data.calledSeekerSwords = true;
        const dirs = cleaves.map((id) => cleaveToDirection[id]);
        return output.quadruple!({ dir1: dirs[0], dir2: dirs[1], dir3: dirs[2], dir4: dirs[3] });
      },
      // Unlike savage mode, Trinity Seeker can be pretty much anywhere.
      // So, turn "absolute cardinal directions" into boss-relative strings.
      // The above function uses cardinal directions to be closer to the DRS code.
      outputStrings: {
        north: {
          en: 'Front',
          ja: '前',
          ko: '앞',
        },
        east: {
          en: 'Right',
          ja: '右',
          ko: '오른쪽',
        },
        south: {
          en: 'Back',
          ja: '後ろ',
          ko: '뒤',
        },
        west: {
          en: 'Left',
          ja: '左',
          ko: '왼쪽',
        },
        double: {
          en: '${dir1} > ${dir2}',
          ja: '${dir1} > ${dir2}',
          ko: '${dir1} > ${dir2}',
        },
        quadruple: {
          en: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          ja: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          ko: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
        },
      },
    },
    {
      id: 'Delubrum Seeker Baleful Swath',
      type: 'StartsUsing',
      // This is an early warning for casters for Baleful Swath on the Verdant Path cast.
      netRegex: { source: 'Trinity Seeker', id: '5A98', capture: false },
      response: Responses.goFrontBack('info'),
    },
    {
      id: 'Delubrum Seeker Baleful Blade Out',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5AA1', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Out Behind Barricade',
          ja: '柵の後ろに',
          ko: '울타리 뒤에 숨어요',
        },
      },
    },
    {
      id: 'Delubrum Seeker Baleful Blade Knockback',
      type: 'StartsUsing',
      // We could call this on Phantom Edge 5AA0, but maybe that's too early?
      netRegex: { source: 'Trinity Seeker', id: '5AA2', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Knocked Into Barricade',
          ja: '柵に吹き飛ばされる',
          ko: '울타리로 넉백',
        },
      },
    },
    {
      // There is no castbar for 5AB7, only this headmarker.
      id: 'Delubrum Seeker Merciful Arc',
      type: 'HeadMarker',
      netRegex: { id: '00F3' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Delubrum Seeker Iron Impact',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5ADB', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line Stack',
          ja: '直線頭割り',
          ko: '힌 줄로 뭉쳐요',
        },
      },
    },
    {
      id: 'Delubrum Seeker Iron Splitter',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5AA3' },
      promise: async (data, matches) => {
        const seekerData = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        });

        if (seekerData === null) {
          console.error(`Iron Splitter: null data`);
          return;
        }
        if (seekerData.combatants.length !== 1) {
          console.error(`Iron Splitter: expected 1, got ${seekerData.combatants.length}`);
          return;
        }

        const seeker = seekerData.combatants[0];
        if (!seeker)
          throw new UnreachableCode();
        const x = seeker.PosX - seekerCenterX;
        const y = seeker.PosY - seekerCenterY;
        data.splitterDist = Math.hypot(x, y);
      },
      alertText: (data, _matches, output) => {
        if (data.splitterDist === undefined)
          return;

        // All 100 examples I've looked at only hit distance=10, or distance=~14
        // Guessing at the other distances, if they exist.
        //
        // blue inner = 0?
        // white inner = 6?
        // blue middle = 10
        // white middle = 14
        // blue outer = 18?
        // white outer = 22?

        const isWhite = Math.floor(data.splitterDist / 4) % 2;
        return isWhite ? output.goBlue!() : output.goWhite!();
      },
      outputStrings: {
        goBlue: {
          en: 'Blue Stone',
          ja: '青い床へ',
          ko: '파랑 장판으로',
        },
        goWhite: {
          en: 'White Sand',
          ja: '白い床へ',
          ko: '하얀 장판으로',
        },
      },
    },
    {
      id: 'Delubrum Seeker Burning Chains',
      type: 'HeadMarker',
      netRegex: { id: '00EE' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chain on YOU',
          ja: '自分に鎖',
          ko: '내게 체인',
        },
      },
    },
    {
      // TODO: the FFXIV parser plugin does not include this as a "gains effect" line.
      id: 'Delubrum Seeker Burning Chains Move',
      type: 'HeadMarker',
      netRegex: { id: '00EE' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 4,
      response: Responses.breakChains(),
    },
    {
      id: 'Delubrum Seeker Dead Iron',
      type: 'HeadMarker',
      netRegex: { id: '00ED' },
      condition: Conditions.targetIsYou(),
      response: Responses.earthshaker(),
    },
    {
      id: 'Delubrum Seeker Merciful Moon',
      type: 'StartsUsing',
      // 3 second warning to match savage timings.
      netRegex: { source: 'Aetherial Orb', id: '5AAC', capture: false },
      delaySeconds: 1,
      alertText: (_data, _matches, output) => output.lookAway!(),
      outputStrings: {
        lookAway: {
          en: 'Look Away From Orb',
          ja: '玉に背を向ける',
          ko: '구슬 보면 안되요',
        },
      },
    },
    {
      id: 'Delubrum Seeker Merciful Blooms',
      type: 'Ability',
      // Call this on the ability of Merciful Moon, it starts casting much earlier.
      netRegex: { source: 'Aetherial Orb', id: '5AAC', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.awayFromPurple!(),
      outputStrings: {
        awayFromPurple: {
          en: 'Away From Purple',
          ja: '花に避ける',
          ko: '꽃 장판 피해요',
        },
      },
    },
    // *** Dahu ***
    {
      id: 'Delubrum Dahu Shockwave',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: ['5760', '5761', '5762', '5763'] },
      // There's a 3s slow windup on the first, then a 1s opposite cast.
      suppressSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '5761' || matches.id === '5763')
          return output.leftThenRight!();
        return output.rightThenLeft!();
      },
      outputStrings: {
        leftThenRight: {
          en: 'Left, Then Right',
          ja: '左 => 右',
          ko: '왼쪽 🔜 오른쪽',
        },
        rightThenLeft: {
          en: 'Right, Then Left',
          ja: '右 => 左',
          ko: '오른쪽 🔜 왼쪽',
        },
      },
    },
    {
      // TODO: is this true if you see a Feral Howl #4 and onward?
      id: 'Delubrum Dahu Feral Howl',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '5755', capture: false },
      alertText: (data, _matches, output) => {
        if (data.seenFeralHowl)
          return output.knockbackAvoid!();
        return output.knockback!();
      },
      run: (data) => data.seenFeralHowl = true,
      outputStrings: {
        knockback: {
          en: 'Unavoidable Knockback',
          ja: '避けないノックバック',
          ko: '못 피하는 넉백',
        },
        knockbackAvoid: {
          // This is also unavoidable, but that's really wordy and hopefully
          // you figured that out the first time.
          en: 'Knockback (Avoid Adds)',
          ja: 'ノックバック (雑魚に触らない)',
          ko: '넉백 (쫄 피해요)',
        },
      },
    },
    {
      id: 'Delubrum Dahu Hot Charge',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '5764', capture: false },
      // This happens twice in a row
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Follow Second Charge',
          ja: '2回目の突進に追う',
          ko: '두번째 돌진 따라가요',
        },
      },
    },
    {
      id: 'Delubrum Dahu Heat Breath',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '5766' },
      response: Responses.tankCleave(),
    },
    {
      id: 'Delubrum Dahu Ripper Claw',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '575D', capture: false },
      response: Responses.awayFromFront(),
    },
    // *** Queen's Guard ***
    {
      id: 'Delubrum Guard Secrets Revealed',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Soldier', id: '5B6E', capture: false },
      infoText: (data, _matches, output) => {
        if (data.seenSecretsRevealed)
          return output.followUntethered!();
        return output.awayFromTethered!();
      },
      run: (data) => data.seenSecretsRevealed = true,
      outputStrings: {
        awayFromTethered: {
          en: 'Away from tethered adds',
          ja: '線に繋がる雑魚から離れる',
          ko: '줄 달린 쫄 피해요',
        },
        followUntethered: {
          en: 'Follow untethered adds',
          ja: '線に繋がらない雑魚に追う',
          ko: '줄 없는 쫄 따라가요',
        },
      },
    },
    {
      id: 'Delubrum Guard Rapid Sever Soldier',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Soldier', id: '5809' },
      condition: tankBusterOnParty,
      response: Responses.tankBuster(),
    },
    {
      id: 'Delubrum Guard Blood And Bone Soldier',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Soldier', id: '5808', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Guard Shot In The Dark',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '5811' },
      condition: tankBusterOnParty,
      response: Responses.tankBuster(),
    },
    {
      id: 'Delubrum Guard Automatic Turret',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '580B', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid Laser Bounces',
          ja: 'レーザーを避ける',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'Delubrum Guard Queen\'s Shot',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '5810', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Guard Reversal Of Forces',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Warrior', id: '57FF', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.reversalOfForces = true,
      outputStrings: {
        text: {
          en: 'Stand On Small Bomb',
          ja: '小さい爆弾を踏む',
          ko: '작은 폭탄 위로',
        },
      },
    },
    {
      id: 'Delubrum Guard Above Board',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Warrior', id: '57FC', capture: false },
      alertText: (data, _matches, output) => {
        if (data.reversalOfForces)
          return;
        return output.text!();
      },
      run: (data) => delete data.reversalOfForces,
      outputStrings: {
        text: {
          en: 'Stand On Large Bomb',
          ja: '大きい爆弾を踏む',
          ko: '큰 폭탄 위로',
        },
      },
    },
    {
      id: 'Delubrum Guard Blood And Bone Warrior',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Warrior', id: '5800', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Guard Shield Omen',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '57F1', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Delubrum Guard Sword Omen',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '57F0', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Delubrum Guard Rapid Sever Knight',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '57FB' },
      condition: tankBusterOnParty,
      response: Responses.tankBuster(),
    },
    {
      id: 'Delubrum Guard Blood And Bone Knight',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '57FA', capture: false },
      response: Responses.aoe(),
    },
    // *** Bozjan Phantom
    {
      id: 'Delubrum Phantom Weave Miasma',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '57A3', capture: false },
      preRun: (data) => data.weaveMiasmaCount = (data.weaveMiasmaCount || 0) + 1,
      delaySeconds: 3,
      infoText: (data, _matches, output) => {
        if (data.weaveMiasmaCount && data.weaveMiasmaCount >= 3)
          return output.weaveWithKnockback!();
        return output.weaveNoKnockback!();
      },
      outputStrings: {
        weaveNoKnockback: {
          en: 'Go To North Circle',
          ja: '北のドーナツ範囲に入る',
          ko: '북쪽 동글로',
        },
        weaveWithKnockback: {
          en: 'Get Knocked Back To Circle',
          ja: '北のドーナツ範囲へ吹き飛ばされる',
          ko: '동글로 넉백',
        },
      },
    },
    {
      id: 'Delubrum Phantom Malediction Of Agony',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '57AF', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Phantom Undying Hatred',
      type: 'StartsUsing',
      // "57AB Summon" is used here to avoid an additional name to translate.
      // "57AC Undying Hatred" is from Stuffy Wraith.
      netRegex: { source: 'Bozjan Phantom', id: '57AB', capture: false },
      delaySeconds: 5,
      // This is covered by Weave Miasma after the first "learn how this works" action.
      suppressSeconds: 9999,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Unavoidable Knockback',
          ja: '避けないノックバック',
          ko: '못 피하는 넉백',
        },
      },
    },
    {
      id: 'Delubrum Phantom Excruciation',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '5809' },
      condition: tankBusterOnParty,
      response: Responses.tankBuster(),
    },
    // *** Trinity Avowed
    {
      id: 'Delubrum Avowed Wrath Of Bozja',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Avowed', id: '5975' },
      response: Responses.tankCleave('alert'),
    },
    {
      id: 'Delubrum Avowed Glory Of Bozja',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Avowed', id: '5976', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Avowed Hot And Cold',
      type: 'GainsEffect',
      // 89D: Running Hot: +1
      // 8A4: Running Hot: +2
      // 8DC: Running Cold: -1
      // 8E2: Running Cold: -2
      netRegex: { effectId: ['89D', '8A4', '8DC', '8E2'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const tempMap: { [id: string]: number } = {
          '89D': 1,
          '8A4': 2,
          '8DC': -1,
          '8E2': -2,
        };
        data.avowedTemperature = tempMap[matches.effectId.toUpperCase()];
      },
    },
    {
      id: 'Delubrum Avowed Freedom Of Bozja',
      type: 'StartsUsing',
      // Arguably, the Elemental Impact (meteor falling) has different ids depending on orb type,
      // e.g. 5960, 5962, 4F55, 4556, 4F99, 4F9A.
      // So we could give directions here, but probably that's just more confusing.
      netRegex: { source: 'Trinity Avowed', id: '597C', capture: false },
      delaySeconds: 10,
      alertText: (data, _matches, output) => {
        switch (data.avowedTemperature) {
          case 2:
            return output.minusTwo!();
          case 1:
            return output.minusOne!();
          case -1:
            return output.plusOne!();
          case -2:
            return output.plusTwo!();
          default:
            return output.unknownTemperature!();
        }
      },
      outputStrings: {
        plusTwo: {
          en: 'Go to +2 Heat Meteor',
          ja: '炎属性+2を踏む',
          ko: '+2 불 메테오로',
        },
        plusOne: {
          en: 'Go to +1 Heat Meteor',
          ja: '炎属性+1を踏む',
          ko: '+1 불 메테오로',
        },
        minusOne: {
          en: 'Go to -1 Cold Meteor',
          ja: '氷属性-1を踏む',
          ko: '-1 얼음 메테오로',
        },
        minusTwo: {
          en: 'Go to -2 Cold Meteor',
          ja: '氷属性-2を踏む',
          ko: '-2 얼음 메테오로',
        },
        unknownTemperature: {
          en: 'Stand In Opposite Meteor',
          ja: '体温と逆のメテオを受ける',
          ko: '반대속성 메테오로',
        },
      },
    },
    {
      id: 'Delubrum Avowed Shimmering Shot',
      type: 'StartsUsing',
      // See comments on Freedom Of Bozja above.
      netRegex: { source: 'Trinity Avowed', id: '597F', capture: false },
      delaySeconds: 3,
      alertText: (data, _matches, output) => {
        switch (data.avowedTemperature) {
          case 2:
            return output.minusTwo!();
          case 1:
            return output.minusOne!();
          case -1:
            return output.plusOne!();
          case -2:
            return output.plusTwo!();
          default:
            return output.unknownTemperature!();
        }
      },
      outputStrings: {
        plusTwo: {
          en: 'Follow +2 Heat Arrow',
          ja: '炎属性+2に従う',
          ko: '+2 불 화살로',
        },
        plusOne: {
          en: 'Follow +1 Heat Arrow',
          ja: '炎属性+1に従う',
          ko: '+1 불 화살로',
        },
        minusOne: {
          en: 'Follow -1 Cold Arrow',
          ja: '氷属性-1に従う',
          ko: '-1 얼음 화살로',
        },
        minusTwo: {
          en: 'Follow -2 Cold Arrow',
          ja: '氷属性-2に従う',
          ko: '-2 얼음 화살로',
        },
        unknownTemperature: {
          en: 'Follow Opposite Arrow',
          ja: '体温と逆のあみだに従う',
          ko: '반대속성 화살로',
        },
      },
    },
    {
      // 5B65 = right cleave, heat+2
      // 5B66 = right cleave, cold+2
      // 5B67 = left cleave, heat+2
      // 5B68 = left cleave, cold+2
      // 596D = right cleave, heat+1
      // 596E = right cleave, cold+1
      // 596F = left cleave, heat+1
      // 5970 = left cleave, cold+1
      id: 'Delubrum Avowed Hot And Cold Cleaves',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Avowed', id: ['5B6[5-8]', '596[DEF]', '5970'] },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          left: {
            en: 'Left',
            ja: '左',
            ko: '왼쪽',
          },
          right: {
            en: 'Right',
            ja: '右',
            ko: '오른쪽',
          },
          plusTwo: {
            en: 'Be in ${side} Cleave (+2 Hot)',
            ja: '${side}側へ (炎属性+2)',
            ko: '${side} 쪼개기 맞아요 (+2 불속성)',
          },
          plusOne: {
            en: 'Be in ${side} Cleave (+1 Hot)',
            ja: '${side}側へ (炎属性+1)',
            ko: '${side} 쪼개기 맞아요(+1 불속성)',
          },
          minusOne: {
            en: 'Be in ${side} Cleave (-1 Cold)',
            ja: '${side}側へ (氷属性-1)',
            ko: '${side} 쪼개기 맞아요 (-1 얼음속성)',
          },
          minusTwo: {
            en: 'Be in ${side} Cleave (-2 Cold)',
            ja: '${side}側へ (氷属性-2)',
            ko: '${side} 쪼개기 맞아요 (-2 얼음속성)',
          },
          avoid: {
            en: 'Go ${side} (avoid!)',
            ja: '${side}側へ (避ける！)',
            ko: '${side}으로 피해요!',
          },
        };

        const isLeft = ['5B67', '5B68', '596F', '5970'].includes(matches.id);
        const side = isLeft ? output.left!() : output.right!();
        const safeSide = isLeft ? output.right!() : output.left!();
        const avoidInfoText = { infoText: output.avoid!({ side: safeSide }) };

        switch (matches.id) {
          case '5B66':
          case '5B68':
            if (data.avowedTemperature === 2)
              return { alertText: output.minusTwo!({ side: side }) };
            return avoidInfoText;
          case '596E':
          case '5970':
            if (data.avowedTemperature === 1)
              return { alertText: output.minusOne!({ side: side }) };
            return avoidInfoText;
          case '596D':
          case '596F':
            if (data.avowedTemperature === -1)
              return { alertText: output.plusOne!({ side: side }) };
            return avoidInfoText;
          case '5B65':
          case '5B67':
            if (data.avowedTemperature === -2)
              return { alertText: output.plusTwo!({ side: side }) };
            return avoidInfoText;
        }
      },
    },
    {
      id: 'Delubrum Avowed Gleaming Arrow Collect',
      type: 'StartsUsing',
      netRegex: { source: 'Avowed Avatar', id: '5974' },
      run: (data, matches) => {
        data.unseenIds ??= [];
        data.unseenIds.push(parseInt(matches.sourceId, 16));
      },
    },
    {
      id: 'Delubrum Avowed Gleaming Arrow',
      type: 'StartsUsing',
      netRegex: { source: 'Avowed Avatar', id: '5974', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 10,
      promise: async (data) => {
        const unseenIds = data.unseenIds;
        if (!unseenIds)
          return;
        const unseenData = await callOverlayHandler({
          call: 'getCombatants',
          ids: unseenIds,
        });

        if (unseenData === null) {
          console.error(`Gleaming Arrow: null data`);
          return;
        }
        if (unseenData.combatants.length !== unseenIds.length) {
          console.error(
            `Gleaming Arrow: expected ${unseenIds.length}, got ${unseenData.combatants.length}`,
          );
          return;
        }

        data.unseenBadRows = [];
        data.unseenBadCols = [];

        for (const avatar of unseenData.combatants) {
          const x = avatar.PosX - avowedCenterX;
          const y = avatar.PosY - avowedCenterY;

          // y=-107 = north side, x = -252, -262, -272, -282, -292
          // x=-247 = left side, y = -62, -72, -82, -92, -102
          // Thus, the possible deltas are -20, -10, 0, +10, +20.
          // The other coordinate is +/-25 from center.
          const maxDist = 22;

          if (Math.abs(x) < maxDist) {
            const col = Math.round((x + 20) / 10);
            data.unseenBadCols.push(col);
          }
          if (Math.abs(y) < maxDist) {
            const row = Math.round((y + 20) / 10);
            data.unseenBadRows.push(row);
          }
        }

        data.unseenBadRows.sort();
        data.unseenBadCols.sort();
      },
      alertText: (data, _matches, output) => {
        delete data.unseenIds;
        if (!data.unseenBadRows || !data.unseenBadCols)
          return;

        // consider asserting that badCols are 0, 2, 4 here.
        if (data.unseenBadRows.includes(2))
          return output.bowLight!();
        return output.bowDark!();
      },
      outputStrings: {
        bowDark: {
          en: 'On Dark (E/W of center)',
          ja: '闇へ (東西)',
          ko: '어두운 타일 (한가운데서 좌우)',
        },
        bowLight: {
          en: 'On Light (diagonal from center)',
          ja: '光へ (斜め)',
          ko: '밝은 타일 (한가운데서 대각)',
        },
      },
    },
    {
      id: 'Delubrum Avowed Fury Of Bozja',
      type: 'StartsUsing',
      // Allegiant Arsenal 5987 = staff (out), followed up with Fury of Bozja 5973
      netRegex: { source: 'Trinity Avowed', id: '5987', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Delubrum Avowed Flashvane',
      type: 'StartsUsing',
      // Allegiant Arsenal 5986 = bow (get behind), followed up by Flashvane 5972
      netRegex: { source: 'Trinity Avowed', id: '5986', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Delubrum Avowed Infernal Slash',
      type: 'StartsUsing',
      // Allegiant Arsenal 5985 = sword (get front), followed up by Infernal Slash 5971
      netRegex: { source: 'Trinity Avowed', id: '5985', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get In Front',
          ja: 'ボスの正面へ',
          ko: '보스 앞으로',
        },
      },
    },
    // *** The Queen
    {
      id: 'Delubrum Queen Empyrean Iniquity',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C8', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Queen Cleansing Slash',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C5' },
      condition: tankBusterOnParty,
      // Probably this is where you swap, but maybe that's not something you can
      // count on in an alliance raid, where there might not even be another tank.
      response: Responses.tankBuster(),
    },
    {
      id: 'Delubrum Queen Cleansing Slash Bleed',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C5' },
      condition: (data) => data.CanCleanse(),
      delaySeconds: 5,
      infoText: (data, matches, output) => {
        return output.text!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        text: {
          en: 'Esuna ${player}',
          ja: 'エスナ: ${player}',
          ko: '에스나: ${player}',
        },
      },
    },
    {
      id: 'Delubrum Queen Northswain\'s Glow',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C3', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      // Technically, this is "away from where the moving lines intersect each other"
      // but "away from orbs" also will do the trick here.
      outputStrings: {
        text: {
          en: 'Away from Line Intersections',
          ja: '十字から離れる',
          ko: '줄이 겹치는 곳에서 먼곳으로',
        },
      },
    },
    {
      id: 'Delubrum Queen Automatic Turret',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '59DE', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid Laser Bounces',
          ja: 'レーザーを避ける',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'Delubrum Queen Reversal Of Forces',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Warrior', id: '59D4', capture: false },
      run: (data) => data.reversalOfForces = true,
    },
    {
      // Called during the knockback cast itself, not during the 59C6 Heaven's Wrath
      // where the knockback line appears.  This is mostly because we don't know about
      // reversal at that point.
      id: 'Delubrum Queen Heaven\'s Wrath',
      type: 'StartsUsing',
      // This is used sometimes by The Queen and sometimes by The Queen's Gunner (?!).
      // This could just be stale parser data though, as the name changes for the actual usage.
      netRegex: { id: '59C7', capture: false },
      alertText: (data, _matches, output) => {
        if (!data.seenHeavensWrath)
          return output.getKnockedTowardsMiddle!();
        if (data.reversalOfForces)
          return output.getKnockedToSmallBomb!();
        return output.getKnockedToLargeBomb!();
      },
      run: (data) => {
        data.seenHeavensWrath = true;
        delete data.reversalOfForces;
      },
      outputStrings: {
        getKnockedTowardsMiddle: {
          en: 'Get Knocked Towards Middle',
          ja: '中へ吹き飛ばされる',
          ko: '한가운데서 넉백',
        },
        getKnockedToSmallBomb: {
          en: 'Get Knocked To Small Bomb',
          ja: '小さい爆弾へ吹き飛ばされる',
          ko: '작은 폭탄으로 넉백',
        },
        getKnockedToLargeBomb: {
          en: 'Get Knocked To Large Bomb',
          ja: '大きい爆弾へ吹き飛ばされる',
          ko: '큰 폭탄으로 넉백',
        },
      },
    },
    {
      id: 'Delubrum Queen Judgment Blade Right',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C2', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Find Charge, Dodge Right',
          ja: '右へ、突進を避ける',
          ko: '돌진 찾고, 오른쪽 피해요',
        },
      },
    },
    {
      id: 'Delubrum Queen Judgment Blade Left',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C1', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Find Charge, Dodge Left',
          ja: '左へ、突進を避ける',
          ko: '돌진 찾고, 왼쪽 피해요',
        },
      },
    },
    {
      id: 'Delubrum Queen Gods Save The Queen',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59C9', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Delubrum Queen Secrets Revealed',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Soldier', id: '5B8A', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away from tethered adds',
          ja: '線に繋がる雑魚から離れる',
          ko: '줄 달린 쫄 피해요',
        },
      },
    },
    {
      id: 'Delubrum Queen Shield Omen',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '59CB', capture: false },
      delaySeconds: 2.5,
      response: Responses.getUnder('alarm'),
    },
    {
      id: 'Delubrum Queen Sword Omen',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '59CA', capture: false },
      delaySeconds: 2.5,
      response: Responses.getOut(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Right-Sided Shockwave/Left-Sided Shockwave': 'Right/Left Shockwave',
        'Left-Sided Shockwave/Right-Sided Shockwave': 'Left/Right Shockwave',
        'Sword Omen/Shield Omen': 'Sword/Shield Omen',
        'Shield Omen/Sword Omen': 'Shield/Sword Omen',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Seeker Avatar': 'Spaltteil Der Sucher',
        'Aetherial Bolt': 'Magiegeschoss',
        'Aetherial Burst': 'Magiebombe',
        'Aetherial Orb': 'Magiekugel',
        'Aetherial Ward': 'Magiewall',
        'Automatic Turret': 'Selbstschuss-Gyrocopter',
        'Avowed Avatar': 'Spaltteil der Eingeschworenen',
        'Blazing Orb': 'Feuerball',
        'Bozjan Phantom': 'Bozja-Phantom',
        'Dahu': 'Dahu',
        'Frost Arrow': 'Frostpfeil',
        'Marchosias': 'Marchosias',
        'Pride of the Lion': 'Saal des Löwen',
        'Queen\'s Gunner': 'Schütze der Königin',
        'Queen\'s Knight': 'Ritter der Königin',
        'Queen\'s Soldier': 'Soldat der Königin',
        'Queen\'s Warrior': 'Kriegerin der Königin',
        'Queensheart': 'Saal der Dienerinnen',
        'Soldier Avatar': 'Spaltteil des Soldaten',
        'Stuffy Wraith': 'muffig(?:e|er|es|en) Schrecken',
        'Swirling Orb': 'Eisball',
        'Tempestuous Orb': 'groß(?:e|er|es|en) Eisball',
        'The Hall of Hieromancy': 'Halle des Orakels',
        'The Hall of Supplication': 'Große Gebetshalle',
        'The Queen': 'Kriegsgöttin',
        'The Theater of One': 'Einsame Arena',
        'The Vault of Singing Crystal': 'Ort des Klingenden Kristalls',
        'Trinity Avowed': 'Trinität der Eingeschworenen',
        'Trinity Seeker': 'Trinität der Sucher',
      },
      'replaceText': {
        '--explosion--': '--Explosion--',
        '--stunned--': '--betäubt--',
        '--unstunned--': '--nicht länger betäubt--',
        'Above Board': 'Über dem Feld',
        'Act Of Mercy': 'Schneller Stich des Dolches',
        'Allegiant Arsenal': 'Waffenwechsel',
        'Automatic Turret': 'Selbstschuss-Gyrocopter',
        'Baleful Blade': 'Stoß der Edelklinge',
        'Baleful Swathe': 'Schwarzer Wirbel der Edelklinge',
        'Beck And Call To Arms': 'Feuerbefehl',
        'Blade Of Entropy': 'Eisflammenklinge',
        'Blood And Bone': 'Wellenschlag',
        'Bombslinger': 'Bombenabwurf',
        'Cleansing Slash': 'Säubernder Schnitt',
        'Coat Of Arms': 'Trotz',
        'Creeping Miasma': 'Miasmahauch',
        'Dead Iron': 'Woge der Feuerfaust',
        'Double Gambit': 'Illusionsmagie',
        'Elemental Arrow': 'Element-Pfeil',
        'Elemental Blast': 'Element-Explosion',
        'Elemental Impact': 'Einschlag',
        'Empyrean Iniquity': 'Empyreische Interdiktion',
        'Excruciation': 'Fürchterlicher Schmerz',
        'Feral Howl': 'Wildes Heulen',
        'Firebreathe': 'Lava-Atem',
        'First Mercy': '1. Streich: Viererdolch-Haltung',
        'Flames Of Bozja': 'Bozianische Flamme',
        'Flashvane': 'Schockpfeile',
        'Fourth Mercy': '4. Streich: Viererdolch-Haltung',
        'Freedom Of Bozja': 'Bozianische Freiheit',
        'Fury Of Bozja': 'Bozianische Wut',
        'Gleaming Arrow': 'Funkelnder Pfeil',
        'Glory Of Bozja': 'Stolz von Bozja',
        'Gods Save The Queen': 'Wächtergott der Königin',
        'Head Down': 'Scharrende Hufe',
        'Heat Breath': 'Hitzeatem',
        'Heated Blast': 'Hitzekugel',
        'Heaven\'s Wrath': 'Heilige Perforation',
        'Hot And Cold': 'Heiß und kalt',
        'Hot Charge': 'Heiße Rage',
        'Hunter\'s Claw': 'Jägerklaue',
        'Infernal Slash': 'Yama-Schnitt',
        'Iron Impact': 'Kanon der Feuerfaust',
        'Iron Splitter': 'Furor der Feuerfaust',
        'Judgment Blade': 'Klinge des Urteils',
        'Left-Sided Shockwave': 'Linke Schockwelle',
        'Lots Cast': 'Magieexplosion',
        'Malediction Of Agony': 'Pochender Fluch',
        'Manipulate Miasma': 'Miasmakontrolle',
        'Merciful Arc': 'Fächertanz des Dolches',
        'Merciful Blooms': 'Kasha des Dolches',
        'Merciful Breeze': 'Yukikaze des Dolches',
        'Merciful Moon': 'Gekko des Dolches',
        'Mercy Fourfold': 'Viererdolch',
        'Northswain\'s Glow': 'Stella Polaris',
        'Optimal Play': 'Bestes Manöver',
        'Pawn Off': 'Kranzklinge',
        'Phantom Edge': 'Phantomklingen',
        'Queen\'s Edict': 'Hohes Edikt der Königin',
        'Queen\'s Justice': 'Hoheitliche Strafe',
        'Queen\'s Shot': 'Omnidirektionalschuss',
        'Queen\'s Will': 'Edikt der Königin',
        'Rapid Sever': 'Radikale Abtrennung',
        'Relentless Play': 'Koordinierter Angriff',
        'Reverberating Roar': 'Sturzimpuls',
        'Reversal Of Forces': 'Materieinversion',
        'Right-Sided Shockwave': 'Rechte Schockwelle',
        'Seasons Of Mercy': 'Setsugekka des Dolches',
        'Second Mercy': '2. Streich: Viererdolch-Haltung',
        'Secrets Revealed': 'Enthüllte Geheimnisse',
        'Shield Omen': 'Schildhaltung',
        'Shimmering Shot': 'Glitzerpfeil',
        'Shot In The Dark': 'Einhändiger Schuss',
        'Strongpoint Defense': 'Widerstand',
        'Summon': 'Beschwörung',
        'Swirling Miasma': 'Miasmawirbel',
        'Sword Omen': 'Schwerthaltung',
        'Tail Swing': 'Schwanzfeger',
        'The Ends': 'Kreuzschnitt',
        'The Means': 'Kreuzschlag',
        'Third Mercy': '3. Streich: Viererdolch-Haltung',
        'Transference': 'Transfer',
        'Turret\'s Tour': 'Querschlägerhagel',
        'Undying Hatred': 'Über-Psychokinese',
        'Unseen Eye': 'Geist des Blütensturms',
        'Verdant Path': 'Lehren des Grünen Pfades',
        'Verdant Tempest': 'Zauberwind des Grünen Pfades',
        'Vile Wave': 'Welle der Boshaftigkeit',
        'Weave Miasma': 'Miasmathese',
        'Wrath Of Bozja': 'Bozianischer Zorn',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Seeker Avatar': 'Clone De La Trinité Soudée',
        'Aetherial Bolt': 'petite bombe',
        'Aetherial Burst': 'énorme bombe',
        'Aetherial Orb': 'amas d\'éther élémentaire',
        'Aetherial Ward': 'Barrière magique',
        'Automatic Turret': 'Auto-tourelle',
        'Avowed Avatar': 'clone de la trinité féale',
        'Blazing Orb': 'boule de feu',
        'Bozjan Phantom': 'fantôme bozjien',
        'Dahu': 'dahu',
        'Frost Arrow': 'volée de flèches de glace',
        'Marchosias': 'marchosias',
        'Pride of the Lion': 'Hall du Lion',
        'Queen\'s Gunner': 'fusilier de la reine',
        'Queen\'s Knight': 'chevalier de la reine',
        'Queen\'s Soldier': 'soldat de la reine',
        'Queen\'s Warrior': 'guerrière de la reine',
        'Queensheart': 'Chambre des prêtresses',
        'Soldier Avatar': 'double de soldat',
        'Stuffy Wraith': 'spectre boursouflé',
        'Swirling Orb': 'boule de glace',
        'Tempestuous Orb': 'grande boule de glace',
        'The Hall of Hieromancy': 'Salle des oracles',
        'The Hall of Supplication': 'Grande salle des prières',
        'The Queen': 'Garde-la-Reine',
        'The Theater of One': 'Amphithéâtre en ruines',
        'The Vault of Singing Crystal': 'Chambre des cristaux chantants',
        'Trinity Avowed': 'trinité féale',
        'Trinity Seeker': 'trinité soudée',
      },
      'replaceText': {
        '\\?': ' ?',
        '--explosion--': '--explosion--',
        '--stunned--': '--étourdi(e)--',
        '--unstunned--': '--non étourdi(e)--',
        'Above Board': 'Aire de flottement',
        'Act Of Mercy': 'Fendreciel rédempteur',
        'Allegiant Arsenal': 'Changement d\'arme',
        'Automatic Turret': 'Auto-tourelle',
        'Baleful Blade': 'Assaut singulier',
        'Baleful Swathe': 'Flux de noirceur singulier',
        'Beck And Call To Arms': 'Ordre d\'attaquer',
        'Blade Of Entropy': 'Sabre du feu et de la glace',
        'Blood And Bone': 'Onde tranchante',
        'Bombslinger': 'Jet de bombe',
        'Cleansing Slash': 'Taillade purifiante',
        'Coat Of Arms': 'Bouclier directionnel',
        'Creeping Miasma': 'Coulée miasmatique',
        'Dead Iron': 'Vague des poings de feu',
        'Double Gambit': 'Manipulation des ombres',
        'Elemental Arrow': 'Flèche élémentaire',
        'Elemental Blast': 'Explosion élémentaire',
        'Elemental Impact': 'Impact',
        'Empyrean Iniquity': 'Injustice empyréenne',
        'Excruciation': 'Atroce douleur',
        'Feral Howl': 'Rugissement sauvage',
        'Firebreathe': 'Souffle de lave',
        'First Mercy': 'Première lame rédemptrice',
        'Flames Of Bozja': 'Flammes de Bozja',
        'Flashvane': 'Flèches fulgurantes',
        'Fourth Mercy': 'Quatrième lame rédemptrice',
        'Freedom Of Bozja': 'Liberté de Bozja',
        'Fury Of Bozja': 'Furie de Bozja',
        'Gleaming Arrow': 'Flèche miroitante',
        'Glory Of Bozja': 'Gloire de Bozja',
        'Gods Save The Queen': 'Que les Dieux gardent la Reine',
        'Head Down': 'Charge bestiale',
        'Heat Breath': 'Souffle brûlant',
        'Heated Blast': 'Déflagration de feu',
        'Heaven\'s Wrath': 'Ire céleste',
        'Hot And Cold': 'Chaud et froid',
        'Hot Charge': 'Charge brûlante',
        'Hunter\'s Claw': 'Griffes prédatrices',
        'Infernal Slash': 'Taillade de Yama',
        'Iron Impact': 'Canon d\'ardeur des poings de feu',
        'Iron Splitter': 'Fracas des poings de feu',
        'Judgment Blade': 'Lame du jugement',
        'Left-Sided Shockwave/Right-Sided Shockwave': 'Onde de choc gauche/droite',
        'Lots Cast': 'Bombe ensorcelée',
        'Malediction Of Agony': 'Malédiction lancinante',
        'Manipulate Miasma': 'Contrôle des miasmes',
        'Merciful Arc': 'Éventail rédempteur',
        'Merciful Blooms': 'Kasha rédempteur',
        'Merciful Breeze': 'Yukikaze rédempteur',
        'Merciful Moon': 'Gekkô rédempteur',
        'Mercy Fourfold': 'Quatuor de lames rédemptrices',
        'Northswain\'s Glow': 'Étoile du Nord',
        'Optimal Play': 'Technique de maître d\'armes',
        'Pawn Off': 'Sabre tournoyant',
        'Phantom Edge': 'Épées spectrales',
        'Queen\'s Edict': 'Injonction de Gunnhildr',
        'Queen\'s Justice': 'Châtiment royal',
        'Queen\'s Shot': 'Tir tous azimuts',
        'Queen\'s Will': 'Édit de Gunnhildr',
        'Rapid Sever': 'Tranchage rapide',
        'Relentless Play': 'Ordre d\'attaque coordonnée',
        'Reverberating Roar': 'Cri disloquant',
        'Reversal Of Forces': 'Inversion des masses',
        'Right-Sided Shockwave/Left-Sided Shockwave': 'Onde de choc droite/gauche',
        'Seasons Of Mercy': 'Setsugekka rédempteur',
        'Second Mercy': 'Deuxième lame rédemptrice',
        'Secrets Revealed': 'Corporification',
        'Shield Omen/Sword Omen': 'Posture du bouclier/épée',
        'Shimmering Shot': 'Flèches scintillantes',
        'Shot In The Dark': 'Tir à une main',
        'Strongpoint Defense': 'Défense absolue',
        'Summon': 'Invocation',
        'Swirling Miasma': 'Anneau miasmatique',
        'Sword Omen/Shield Omen': 'Posture de l\'épée/bouclier',
        'Tail Swing': 'Queue balayante',
        'The Ends': 'Croix lacérante',
        'The Means': 'Croix perforante',
        'Third Mercy': 'Troisième lame rédemptrice',
        'Transference': 'Transfert',
        'Turret\'s Tour': 'Ricochets frénétiques',
        'Undying Hatred': 'Psychokinèse',
        'Unseen Eye': 'Spectres de l\'ouragan de fleurs',
        'Verdant Path': 'École de la Voie verdoyante',
        'Verdant Tempest': 'Tempête de la Voie verdoyante',
        'Vile Wave': 'Vague de malveillance',
        'Weave Miasma': 'Miasmologie',
        'Wrath Of Bozja': 'Courroux de Bozja',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Seeker Avatar': 'シーカーの分体',
        'Aetherial Bolt': '魔弾',
        'Aetherial Burst': '大魔弾',
        'Aetherial Orb': '魔力塊',
        'Aetherial Ward': '魔法障壁',
        'Automatic Turret': 'オートタレット',
        'Avowed Avatar': 'アヴァウドの分体',
        'Blazing Orb': '炎球',
        'Bozjan Phantom': 'ボズヤ・ファントム',
        'Dahu': 'ダウー',
        'Frost Arrow': 'フロストアロー',
        'Marchosias': 'マルコシアス',
        'Pride of the Lion': '雄獅子の広間',
        'Queen\'s Gunner': 'クイーンズ・ガンナー',
        'Queen\'s Knight': 'クイーンズ・ナイト',
        'Queen\'s Soldier': 'クイーンズ・ソルジャー',
        'Queen\'s Warrior': 'クイーンズ・ウォリアー',
        'Queensheart': '巫女たちの広間',
        'Soldier Avatar': 'ソルジャーの分体',
        'Stuffy Wraith': 'スタフィー・レイス',
        'Swirling Orb': '氷球',
        'Tempestuous Orb': '大氷球',
        'The Hall of Hieromancy': '託宣所',
        'The Hall of Supplication': '大祈祷所',
        'The Queen': 'セイブ・ザ・クイーン',
        'The Theater of One': '円形劇場跡',
        'The Vault of Singing Crystal': '響き合う水晶の間',
        'Trinity Avowed': 'トリニティ・アヴァウド',
        'Trinity Seeker': 'トリニティ・シーカー',
      },
      'replaceText': {
        '--explosion--': '--爆発--',
        '--stunned--': '--スタンされる--',
        '--unstunned--': '--スタンされない--',
        'Above Board': '浮遊波',
        'Act Of Mercy': '破天鋭刃風',
        'Allegiant Arsenal': 'ウェポンチェンジ',
        'Automatic Turret': 'オートタレット',
        'Baleful Blade': '豪剣強襲撃',
        'Baleful Swathe': '豪剣黒流破',
        'Beck And Call To Arms': '攻撃命令',
        'Blade Of Entropy': '氷炎刃',
        'Blood And Bone': '波動斬',
        'Bombslinger': '爆弾投擲',
        'Cleansing Slash': '乱命割殺斬',
        'Coat Of Arms': '偏向防御',
        'Creeping Miasma': '瘴気流',
        'Dead Iron': '熱拳振動波',
        'Double Gambit': '幻影術',
        'Elemental Arrow': '熱/凍気矢',
        'Elemental Blast': '熱/凍気弾',
        'Elemental Impact': '着弾',
        'Empyrean Iniquity': '天魔鬼神爆',
        'Excruciation': '激痛',
        'Feral Howl': 'フェラルハウル',
        'Firebreathe': 'ラーヴァブレス',
        'First Mercy': '初手：鋭刃四刀の構え',
        'Flames Of Bozja': 'フレイム・オブ・ボズヤ',
        'Flashvane': 'フラッシュアロー',
        'Fourth Mercy': '四手：鋭刃四刀の構え',
        'Freedom Of Bozja': 'リバティ・オブ・ボズヤ',
        'Fury Of Bozja': 'フューリー・オブ・ボズヤ',
        'Gleaming Arrow': 'グリッターアロー',
        'Glory Of Bozja': 'グローリー・オブ・ボズヤ',
        'Gods Save The Queen': 'ゴッド・セイブ・ザ・クイーン',
        'Head Down': 'ビーストチャージ',
        'Heat Breath': '火炎の息',
        'Heated Blast': '熱気弾',
        'Heaven\'s Wrath': '聖光爆裂斬',
        'Hot And Cold': '氷炎乱流',
        'Hot Charge': 'ホットチャージ',
        'Hunter\'s Claw': 'ハンタークロウ',
        'Infernal Slash': 'ヤーマスラッシュ',
        'Iron Impact': '熱拳烈気砲',
        'Iron Splitter': '熱拳地脈爆',
        'Judgment Blade': '不動無明剣',
        'Left-Sided Shockwave': 'レフトサイド・ショックウェーブ',
        'Lots Cast': '魔爆発',
        'Malediction Of Agony': '苦悶の呪詛',
        'Manipulate Miasma': '瘴気操作',
        'Merciful Arc': '鋭刃舞踏扇',
        'Merciful Blooms': '鋭刃花車',
        'Merciful Breeze': '鋭刃雪風',
        'Merciful Moon': '鋭刃月光',
        'Mercy Fourfold': '鋭刃四刀流',
        'Northswain\'s Glow': '北斗骨砕斬',
        'Optimal Play': '武装戦技',
        'Pawn Off': '旋回刃',
        'Phantom Edge': '霊幻剣',
        'Queen\'s Edict': '女王の大勅令',
        'Queen\'s Justice': '処罰令',
        'Queen\'s Shot': '全方位射撃',
        'Queen\'s Will': '女王の勅令',
        'Rapid Sever': '滅多斬り',
        'Relentless Play': '連携命令',
        'Reverberating Roar': '崩落誘発',
        'Reversal Of Forces': '質量転換',
        'Right-Sided Shockwave': 'ライトサイド・ショックウェーブ',
        'Seasons Of Mercy': '鋭刃雪月花',
        'Second Mercy': '二手：鋭刃四刀の構え',
        'Secrets Revealed': '実体結像',
        'Shield Omen': '盾の型',
        'Shimmering Shot': 'トゥインクルアロー',
        'Shot In The Dark': '片手撃ち',
        'Strongpoint Defense': '絶対防御',
        'Summon': '召喚',
        'Swirling Miasma': '瘴気輪',
        'Sword Omen': '剣の型',
        'Tail Swing': 'テールスイング',
        'The Ends': '十字斬',
        'The Means': '十字撃',
        'Third Mercy': '三手：鋭刃四刀の構え',
        'Transference': '転移',
        'Turret\'s Tour': '跳弾乱舞',
        'Undying Hatred': '超ねんりき',
        'Unseen Eye': '花嵐の幻影',
        'Verdant Path': '翠流派',
        'Verdant Tempest': '翠流魔風塵',
        'Vile Wave': '悪意の波動',
        'Weave Miasma': '瘴気術',
        'Wrath Of Bozja': 'ラース・オブ・ボズヤ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Seeker Avatar': '求道之分身',
        'Aetherial Bolt': '魔弹',
        'Aetherial Burst': '大魔弹',
        'Aetherial Orb': '魔力块',
        'Aetherial Ward': '魔法障壁',
        'Automatic Turret': '自动炮塔',
        'Avowed Avatar': '誓约之分身',
        'Blazing Orb': '火球',
        'Bozjan Phantom': '博兹雅幻灵',
        'Dahu': '大兀',
        'Frost Arrow': '寒霜箭',
        'Marchosias': '马可西亚斯',
        'Pride of the Lion': '雄狮大厅',
        'Queen\'s Gunner': '女王枪手',
        'Queen\'s Knight': '女王骑士',
        'Queen\'s Soldier': '女王士兵',
        'Queen\'s Warrior': '女王战士',
        'Queensheart': '巫女大厅',
        'Soldier Avatar': '士兵的分身',
        'Stuffy Wraith': '沉闷幽灵',
        'Swirling Orb': '冰球',
        'Tempestuous Orb': '大冰球',
        'The Hall of Hieromancy': '神谕所',
        'The Hall of Supplication': '大祈祷所',
        'The Queen': '天佑女王',
        'The Theater of One': '圆形剧场遗迹',
        'The Vault of Singing Crystal': '和鸣水晶之间',
        'Trinity Avowed': '誓约之三位一体',
        'Trinity Seeker': '求道之三位一体',
      },
      'replaceText': {
        '--explosion--': '--爆炸--',
        '--stunned--': '--眩晕--',
        '--unstunned--': '--眩晕结束--',
        'Above Board': '浮游波',
        'Act Of Mercy': '破天慈刃风',
        'Allegiant Arsenal': '变换武器',
        'Automatic Turret': '自动炮塔',
        'Baleful Blade': '豪剑强袭击',
        'Baleful Swathe': '豪剑黑流破',
        'Beck And Call To Arms': '攻击命令',
        'Blade Of Entropy': '冰炎刃',
        'Blood And Bone': '波动斩',
        'Bombslinger': '投掷炸弹',
        'Cleansing Slash': '乱命割杀斩',
        'Coat Of Arms': '偏向防御',
        'Creeping Miasma': '瘴气流',
        'Dead Iron': '热拳振动波',
        'Double Gambit': '幻影术',
        'Elemental Arrow': '元素箭',
        'Elemental Blast': '元素爆破',
        'Elemental Impact': '中弹',
        'Empyrean Iniquity': '天魔鬼神爆',
        'Excruciation': '剧痛',
        'Feral Howl': '野性嚎叫',
        'Firebreathe': '岩浆吐息',
        'First Mercy': '慈悲四刀第一念',
        'Flames Of Bozja': '博兹雅火焰',
        'Flashvane': '闪光箭',
        'Fourth Mercy': '慈悲四刀第四念',
        'Freedom Of Bozja': '博兹雅之自由',
        'Fury Of Bozja': '博兹雅之怒',
        'Gleaming Arrow': '闪耀箭',
        'Glory Of Bozja': '博兹雅之荣',
        'Gods Save The Queen': '神佑女王',
        'Head Down': '兽性冲击',
        'Heat Breath': '灼热吐息',
        'Heated Blast': '热浪弹',
        'Heaven\'s Wrath': '圣光爆裂斩',
        'Hot And Cold': '冰炎乱流',
        'Hot Charge': '炽热冲锋',
        'Hunter\'s Claw': '狩猎者之爪',
        'Infernal Slash': '地狱斩',
        'Iron Impact': '热拳烈气炮',
        'Iron Splitter': '热拳地脉爆',
        'Judgment Blade': '不动无明剑',
        'Left-Sided Shockwave': '左侧震荡波',
        'Lots Cast': '魔爆炸',
        'Malediction Of Agony': '苦闷的诅咒',
        'Manipulate Miasma': '操作瘴气',
        'Merciful Arc': '慈悲舞动扇',
        'Merciful Blooms': '慈悲花车',
        'Merciful Breeze': '慈悲雪风',
        'Merciful Moon': '慈悲月光',
        'Mercy Fourfold': '慈悲四刀流',
        'Northswain\'s Glow': '北斗骨碎斩',
        'Optimal Play': '武装战技',
        'Pawn Off': '旋回刃',
        'Phantom Edge': '灵幻剑',
        'Queen\'s Edict': '女王的大敕令',
        'Queen\'s Justice': '处罚令',
        'Queen\'s Shot': '全方位射击',
        'Queen\'s Will': '女王的敕令',
        'Rapid Sever': '急促斩击',
        'Relentless Play': '协作指令',
        'Reverberating Roar': '引发崩塌',
        'Reversal Of Forces': '质量转换',
        'Right-Sided Shockwave': '右侧震荡波',
        'Seasons Of Mercy': '慈悲雪月花',
        'Second Mercy': '慈悲四刀第二念',
        'Secrets Revealed': '实体成像',
        'Shield Omen': '盾型',
        'Shimmering Shot': '闪烁箭',
        'Shot In The Dark': '单手射击',
        'Strongpoint Defense': '绝对防御',
        'Summon': '召唤',
        'Swirling Miasma': '瘴气圈',
        'Sword Omen': '剑型',
        'Tail Swing': '回旋尾',
        'The Ends': '十字斩',
        'The Means': '十字击',
        'Third Mercy': '慈悲四刀第三念',
        'Transference': '转移',
        'Turret\'s Tour': '跳弹乱舞',
        'Undying Hatred': '超念力',
        'Unseen Eye': '风花舞的幻影',
        'Verdant Path': '翠青流',
        'Verdant Tempest': '翠青魔风尘',
        'Vile Wave': '恶意的波动',
        'Weave Miasma': '瘴气术',
        'Wrath Of Bozja': '博兹雅之愤',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Seeker Avatar': '求道之分身',
        'Aetherial Bolt': '魔彈',
        'Aetherial Burst': '大魔彈',
        'Aetherial Orb': '魔力塊',
        'Aetherial Ward': '魔法障壁',
        'Automatic Turret': '自動砲臺',
        'Avowed Avatar': '誓約之分身',
        'Blazing Orb': '火球',
        'Bozjan Phantom': '博茲雅幻靈',
        'Dahu': '大兀',
        'Frost Arrow': '寒霜箭',
        'Marchosias': '馬可西亞斯',
        'Pride of the Lion': '雄獅大廳',
        'Queen\'s Gunner': '女王槍手',
        'Queen\'s Knight': '女王騎士',
        'Queen\'s Soldier': '女王士兵',
        'Queen\'s Warrior': '女王戰士',
        'Queensheart': '巫女大廳',
        'Soldier Avatar': '士兵的分身',
        'Stuffy Wraith': '沉悶幽靈',
        'Swirling Orb': '冰球',
        'Tempestuous Orb': '大冰球',
        'The Hall of Hieromancy': '神諭所',
        'The Hall of Supplication': '大祈禱所',
        'The Queen': '天佑女王',
        'The Theater of One': '圓形劇場遺跡',
        'The Vault of Singing Crystal': '和鳴水晶之間',
        'Trinity Avowed': '誓約之三位一體',
        'Trinity Seeker': '求道之三位一體',
      },
      'replaceText': {
        '--explosion--': '北斗骨碎斬',
        // '--stunned--': '', // FIXME '--眩晕--'
        // '--unstunned--': '', // FIXME '--眩晕结束--'
        'Above Board': '浮游波',
        'Act Of Mercy': '破天慈刃風',
        'Allegiant Arsenal': '變換武器',
        'Automatic Turret': '自動砲塔',
        'Baleful Blade': '豪劍強襲擊',
        'Baleful Swathe': '豪劍黑流破',
        'Beck And Call To Arms': '攻擊命令',
        'Blade Of Entropy': '冰炎刃',
        'Blood And Bone': '波動斬',
        'Bombslinger': '投擲炸彈',
        'Cleansing Slash': '亂命割殺斬',
        'Coat Of Arms': '偏向防禦',
        'Creeping Miasma': '瘴氣流',
        'Dead Iron': '熱拳振動波',
        'Double Gambit': '幻影術',
        'Elemental Arrow': '凍結箭',
        'Elemental Blast': '熱浪彈',
        'Elemental Impact': '轟擊',
        'Empyrean Iniquity': '天魔鬼神爆',
        'Excruciation': '劇痛',
        'Feral Howl': '野性嚎叫',
        'Firebreathe': '岩漿吐息',
        'First Mercy': '慈悲四刀第一念',
        'Flames Of Bozja': '博茲雅火焰',
        'Flashvane': '閃光箭',
        'Fourth Mercy': '慈悲四刀第四念',
        'Freedom Of Bozja': '博茲雅之自由',
        'Fury Of Bozja': '博茲雅之怒',
        'Gleaming Arrow': '閃耀箭',
        'Glory Of Bozja': '博茲雅之榮',
        'Gods Save The Queen': '神佑女王',
        'Head Down': '獸性衝擊',
        'Heat Breath': '灼熱吐息',
        'Heated Blast': '熱浪彈',
        'Heaven\'s Wrath': '聖光爆裂斬',
        'Hot And Cold': '冰炎亂流',
        'Hot Charge': '熾熱衝鋒',
        'Hunter\'s Claw': '狩獵者之爪',
        'Infernal Slash': '地獄斬',
        'Iron Impact': '熱拳烈氣砲',
        'Iron Splitter': '熱拳地脈爆',
        'Judgment Blade': '不動無明劍',
        'Left-Sided Shockwave': '左側衝擊狂潮',
        'Lots Cast': '魔爆炸',
        'Malediction Of Agony': '苦悶的詛咒',
        'Manipulate Miasma': '操作瘴氣',
        'Merciful Arc': '慈悲舞動扇',
        'Merciful Blooms': '慈悲花車',
        'Merciful Breeze': '慈悲雪風',
        'Merciful Moon': '慈悲月光',
        'Mercy Fourfold': '慈悲四刀流',
        'Northswain\'s Glow': '北斗骨碎斬',
        'Optimal Play': '武装戦技',
        'Pawn Off': '旋回刃',
        'Phantom Edge': '靈幻劍',
        'Queen\'s Edict': '女王的大敕令',
        'Queen\'s Justice': '處罰令',
        'Queen\'s Shot': '全方位射擊',
        'Queen\'s Will': '女王的敕令',
        'Rapid Sever': '急促斬擊',
        'Relentless Play': '協作指令',
        'Reverberating Roar': '引發崩塌',
        'Reversal Of Forces': '品質轉換',
        'Right-Sided Shockwave': '右側衝擊狂潮',
        'Seasons Of Mercy': '慈悲雪月花',
        'Second Mercy': '慈悲四刀第二念',
        'Secrets Revealed': '實體成像',
        'Shield Omen': '盾型',
        'Shimmering Shot': '閃爍箭',
        'Shot In The Dark': '單手射擊',
        'Strongpoint Defense': '絕對防禦',
        'Summon': '召喚',
        'Swirling Miasma': '瘴氣圈',
        'Sword Omen': '劍型',
        'Tail Swing': '迴旋尾',
        'The Ends': '十字斬',
        'The Means': '十字擊',
        'Third Mercy': '慈悲四刀第三念',
        'Transference': '轉移',
        'Turret\'s Tour': '跳彈亂舞',
        'Undying Hatred': '超念力',
        'Unseen Eye': '風花舞的幻影',
        'Verdant Path': '翠青流',
        'Verdant Tempest': '翠青魔風塵',
        'Vile Wave': '惡意的波動',
        'Weave Miasma': '瘴氣術',
        'Wrath Of Bozja': '博茲雅之憤',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Seeker Avatar': '탐구의 분열체',
        'Aetherial Bolt': '마탄',
        'Aetherial Burst': '대마탄',
        'Aetherial Orb': '마력 덩어리',
        'Aetherial Ward': '마법 장벽',
        'Automatic Turret': '자동포탑',
        'Avowed Avatar': '맹세의 분열체',
        'Blazing Orb': '화염 구체',
        'Bozjan Phantom': '보즈야 유령',
        'Dahu': '다후',
        'Frost Arrow': '서리 화살',
        'Marchosias': '마르코시아스',
        'Pride of the Lion': '수사자의 방',
        'Queen\'s Gunner': '여왕의 총사',
        'Queen\'s Knight': '여왕의 기사',
        'Queen\'s Soldier': '여왕의 병사',
        'Queen\'s Warrior': '여왕의 전사',
        'Queensheart': '무녀들의 방',
        'Soldier Avatar': '병사 분열체',
        'Stuffy Wraith': '케케묵은 망령',
        'Swirling Orb': '얼음 구체',
        'Tempestuous Orb': '거대 얼음 구체',
        'The Hall of Hieromancy': '신탁소',
        'The Hall of Supplication': '대기도소',
        'The Queen': '세이브 더 퀸',
        'The Theater of One': '원형 극장 옛터',
        'The Vault of Singing Crystal': '공명하는 수정의 방',
        'Trinity Avowed': '맹세의 삼위일체',
        'Trinity Seeker': '탐구의 삼위일체',
      },
      'replaceText': {
        '--explosion--': '--폭발--',
        '--stunned--': '--기절--',
        '--unstunned--': '--기절풀림--',
        'Above Board': '부유파',
        'Act Of Mercy': '예리한 파천풍',
        'Allegiant Arsenal': '무기 변경',
        'Automatic Turret': '자동포탑',
        'Baleful Blade': '호검 강습 공격',
        'Baleful Swathe': '호검 흑류파',
        'Beck And Call To Arms': '공격 명령',
        'Blade Of Entropy': '얼음불 칼날',
        'Blood And Bone': '파동참',
        'Bombslinger': '폭탄 투척',
        'Cleansing Slash': '난명할살참',
        'Coat Of Arms': '편향 방어',
        'Creeping Miasma': '독기 흐름',
        'Dead Iron': '불주먹 진동파',
        'Double Gambit': '환영술',
        'Elemental Arrow': '속성 화살',
        'Elemental Blast': '속성 운석 폭발',
        'Elemental Impact': '착탄',
        'Empyrean Iniquity': '천마귀신폭',
        'Excruciation': '격통',
        'Feral Howl': '야성의 포효',
        'Firebreathe': '용암숨',
        'First Mercy': '예리한 첫 번째 검',
        'Flames Of Bozja': '보즈야 플레임',
        'Flashvane': '섬광 화살',
        'Fourth Mercy': '예리한 네 번째 검',
        'Freedom Of Bozja': '보즈야의 자유',
        'Fury Of Bozja': '보즈야의 분노',
        'Gleaming Arrow': '현란한 화살',
        'Glory Of Bozja': '보즈야의 영광',
        'Gods Save The Queen': '갓 세이브 더 퀸',
        'Head Down': '야수 돌격',
        'Heat Breath': '화염의 숨결',
        'Heated Blast': '열기탄',
        'Heaven\'s Wrath': '성광폭렬참',
        'Hot And Cold': '빙염난류',
        'Hot Charge': '맹렬한 돌진',
        'Hunter\'s Claw': '사냥꾼의 발톱',
        'Infernal Slash': '연옥 베기',
        'Iron Impact': '불주먹 열기포',
        'Iron Splitter': '불주먹 지맥 폭발',
        'Judgment Blade': '부동무명검',
        'Left-Sided Shockwave': '왼쪽 충격파',
        'Lots Cast': '마폭발',
        'Malediction Of Agony': '고통의 저주',
        'Manipulate Miasma': '독기 조작',
        'Merciful Arc': '예리한 부채검',
        'Merciful Blooms': '예리한 화차',
        'Merciful Breeze': '예리한 설풍',
        'Merciful Moon': '예리한 월광',
        'Mercy Fourfold': '예리한 사도류',
        'Northswain\'s Glow': '북두골쇄참',
        'Optimal Play': '무장 전술',
        'Pawn Off': '선회인',
        'Phantom Edge': '영환검',
        'Queen\'s Edict': '여왕의 대칙령',
        'Queen\'s Justice': '처벌령',
        'Queen\'s Shot': '전방위 사격',
        'Queen\'s Will': '여왕의 칙령',
        'Rapid Sever': '마구 베기',
        'Relentless Play': '연계 명령',
        'Reverberating Roar': '낙석 유발',
        'Reversal Of Forces': '질량 전환',
        'Right-Sided Shockwave': '오른쪽 충격파',
        'Seasons Of Mercy': '예리한 설월화',
        'Second Mercy': '예리한 두 번째 검',
        'Secrets Revealed': '실체 이루기',
        'Shield Omen': '방패 태세',
        'Shimmering Shot': '반짝반짝 화살',
        'Shot In The Dark': '한손 쏘기',
        'Strongpoint Defense': '절대 방어',
        'Summon': '소환',
        'Swirling Miasma': '독기 고리',
        'Sword Omen': '검 태세',
        'Tail Swing': '꼬리 휘두르기',
        'The Ends': '십자참',
        'The Means': '십자격',
        'Third Mercy': '예리한 세 번째 검',
        'Transference': '전이',
        'Turret\'s Tour': '도탄난무',
        'Undying Hatred': '초염력',
        'Unseen Eye': '꽃폭풍의 환영',
        'Verdant Path': '취일문 유파',
        'Verdant Tempest': '취일문 마풍진',
        'Vile Wave': '악의의 파동',
        'Weave Miasma': '독기술',
        'Wrath Of Bozja': '보즈야의 격노',
      },
    },
  ],
};

export default triggerSet;
