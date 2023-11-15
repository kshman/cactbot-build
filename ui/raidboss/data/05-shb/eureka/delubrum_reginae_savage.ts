import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { LocaleText, TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  decOffset?: number;
  firstUnknownHeadmarker?: string;
  gloryOfBozjaCount?: number;
  seekerFirstMercy?: NetMatches['Ability'];
  seekerSwords?: string[];
  calledSeekerSwords?: boolean;
  splitterDist?: number;
  seekerCometIds?: number[];
  seekerCometData?: PluginCombatantState[];
  seenHotCharge?: boolean;
  hystericFlare?: boolean;
  tetherIsBombslinger?: boolean;
  tetherOnBomb?: boolean;
  tetherOnSelf?: boolean;
  weaveCount?: number;
  avowedPhase?: string;
  currentTemperature?: number;
  currentBrand?: number;
  forcedMarch?: string;
  blades?: { [id: number]: string };
  safeZone?: string;
  unseenIds?: number[];
  unseenBadRows?: number[];
  unseenBadCols?: number[];
  labyrinthineFate?: string;
  seenLabyrinthineFate?: boolean;
  queenDispelCount?: number;
}

// TODO: warnings for mines after bosses?

// TODO: headmarkers of course have a random offset here eyeroll
const headmarker = {
  mercifulArc: '00F3',
  burningChains: '00EE',
  earthshaker: '00ED',
  spitFlame1: '004F',
  spitFlame2: '0050',
  spitFlame3: '0051',
  spitFlame4: '0052',
  flare: '0057',
  reversal: '00FF', // also tether 0087
  spiteSmite: '0017',
  wrath: '0100',
  foeSplitter: '00C6',
  thunder: '00A0',
  edictSuccess: '0088',
  edictFailure: '0089',
};

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

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (data.decOffset === undefined) {
    // If we don't know, return garbage to avoid accidentally running other triggers.
    if (data.firstUnknownHeadmarker === undefined)
      return '0000';

    data.decOffset = parseInt(matches.id, 16) - parseInt(data.firstUnknownHeadmarker, 16);
  }
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  const hexId = (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase();
  return `000${hexId}`.slice(-4);
};

const triggerSet: TriggerSet<Data> = {
  id: 'DelubrumReginaeSavage',
  zoneId: ZoneId.DelubrumReginaeSavage,
  timelineFile: 'delubrum_reginae_savage.txt',
  timelineTriggers: [
    {
      id: 'DelubrumSav Seeker Baleful Comet',
      regex: /Baleful Comet 1/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // Comets have impact damage when dropping, so warn to avoid this.
          en: 'Get in for comets',
          de: 'Geh rein für Kometen',
          fr: 'Entrez pour les comètes',
          ja: '中で避ける',
          cn: '中间躲避',
          ko: '한가운데서 운석 맞아요',
        },
      },
    },
    {
      id: 'DelubrumSav Avowed Glory Of Bozja',
      regex: /Glory Of Bozja(?! Enrage)/,
      // Cast itself is 5.5 seconds, add more warning
      beforeSeconds: 8,
      // Count the number of Glory of Bozja so that people alternating mitigation
      // can more easily assign themselves to even or odd glories.
      preRun: (data) => data.gloryOfBozjaCount = (data.gloryOfBozjaCount ?? 0) + 1,
      durationSeconds: 8,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => output.aoeNum!({ num: data.gloryOfBozjaCount }),
      outputStrings: {
        aoeNum: {
          en: 'Big AOE + Bleed (#${num})',
          de: 'Große AoE + Blutung (#${num})',
          fr: 'Grosse AoE + Saignement (#${num})',
          ja: '全体攻撃 + 継続ダメージ (#${num})',
          cn: '高伤AoE + DoT (#${num})',
          ko: '전체 공격 + 출혈 (#${num})',
        },
      },
    },
    {
      id: 'DelubrumSav Lord Vicious Swipe',
      regex: /Vicious Swipe/,
      // There are different timings in the first and second phase.
      // Consistently use 5 seconds beforehand for both.
      beforeSeconds: 5,
      suppressSeconds: 1,
      response: Responses.knockback(),
    },
    {
      id: 'DelubrumSav Lord Thunderous Discharge',
      regex: /Thunderous Discharge/,
      // Cast in the timeline is 5 seconds, but there is an additional .5 second cast before damage
      beforeSeconds: 7,
      suppressSeconds: 1,
      response: Responses.aoe(),
    },
    {
      id: 'DelubrumSav Queen Empyrean Iniquity',
      regex: /Empyrean Iniquity/,
      // Cast itself is 5 seconds, add more warning
      beforeSeconds: 9,
      durationSeconds: 9,
      suppressSeconds: 1,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'DelubrumSav Queen Gods Save The Queen',
      regex: /Gods Save The Queen$/,
      // Cast in the timeline is 5 seconds, but there is an additional 1 second cast before damage
      beforeSeconds: 7,
      durationSeconds: 5,
      suppressSeconds: 1,
      response: Responses.aoe(),
    },
  ],
  triggers: [
    {
      id: 'DelubrumSav Seeker Phase',
      type: 'StartsUsing',
      // Sets the phase when seeing the Verdant Tempest cast.
      netRegex: { source: 'Trinity Seeker', id: '5AD3', capture: false },
      // Note: this headmarker *could* be skipped, so we will change this later.
      run: (data) => data.firstUnknownHeadmarker = headmarker.mercifulArc,
    },
    {
      id: 'DelubrumSav Seeker Verdant Tempest',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5AD3', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'DelubrumSav Seeker Sword Cleanup',
      type: 'StartsUsing',
      // This is on First Mercy, which starts before the first ability.
      netRegex: { source: ['Trinity Seeker', 'Seeker Avatar'], id: '5B61', capture: false },
      run: (data) => {
        delete data.seekerSwords;
        delete data.calledSeekerSwords;
        delete data.seekerFirstMercy;
      },
    },
    {
      id: 'DelubrumSav Seeker First Mercy',
      type: 'Ability',
      netRegex: { source: ['Trinity Seeker', 'Seeker Avatar'], id: '5B61' },
      run: (data, matches) => data.seekerFirstMercy = matches,
    },
    {
      id: 'DelubrumSav Seeker Mercy Swords',
      type: 'GainsEffect',
      netRegex: { target: ['Trinity Seeker', 'Seeker Avatar'], effectId: '808' },
      condition: (data) => !data.calledSeekerSwords,
      durationSeconds: 10,
      alertText: (data, matches, output) => {
        data.seekerSwords ??= [];
        data.seekerSwords.push(matches.count.toUpperCase());

        if (data.seekerSwords.length <= 1 || data.seekerSwords.length >= 4)
          return;

        if (!data.seekerFirstMercy) {
          console.error(`Swords: missing first mercy`);
          return;
        }

        const posX = parseFloat(data.seekerFirstMercy.x) - seekerCenterX;
        const posY = parseFloat(data.seekerFirstMercy.y) - seekerCenterY;

        const isClone = Math.hypot(posX, posY) > 10;
        // 0 = N, 1 = E, etc
        const pos = Math.round(2 - 2 * Math.atan2(posX, posY) / Math.PI) % 4;
        const heading = Math.round(2 - 2 * parseFloat(data.seekerFirstMercy.heading) / Math.PI) % 4;
        const cleaves = data.seekerSwords;

        // For boss, rotate so that front = cardinal north.
        // For clones, rotate so that front/north = out.
        const rotateDir = (dir: number) => (4 + dir - (isClone ? pos : 0) + heading) % 4;

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

          const singleSafeZone = intersect[0];
          if (singleSafeZone === undefined)
            throw new UnreachableCode();
          const cardinal = rotateDir(singleSafeZone);
          if (isClone) {
            // Trinity Seeker has a lot of limbs and people have a VERY hard time with
            // left vs right at the best of times.  Use "in and out" here on the clone
            // to make sure this doesn't get messed up.  This may mean that there is a
            // simpler left->right pattern that could be called, but we're ignoring it
            // for clarity of communication.
            if (cardinal === dir.north) {
              data.calledSeekerSwords = true;
              return output.double!({ dir1: output.out!(), dir2: output.in!() });
            } else if (cardinal === dir.south) {
              data.calledSeekerSwords = true;
              return output.double!({ dir1: output.in!(), dir2: output.out!() });
            }

            // We'll call it the hard way.
            return;
          }

          data.calledSeekerSwords = true;
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

        // Find the cleave we're missing and add it to the list.
        const finalCleaveList = ['F7', 'F8', 'F9', 'FA'].filter((id) => !cleaves.includes(id));
        const finalCleave = finalCleaveList[0];
        if (finalCleave === undefined || finalCleaveList.length !== 1) {
          console.error(`Swords: bad intersection ${JSON.stringify(data.seekerSwords)}`);
          return;
        }
        cleaves.push(finalCleave);

        // Seen three clones, which means we weren't able to call with two.
        // Try to call out something the best we can.

        // "offset" here, being rotate 1/8 of a circle clockwise from 0=north, so 0=NE now.
        // This is the unsafe direction.  We convert to numbers so we can rotate them.
        const offsetDir = { frontRight: 0, backRight: 1, backLeft: 2, frontLeft: 3 };
        const cleaveToOffsetDir: { [cleave: string]: number } = {
          F7: offsetDir.frontRight,
          F8: offsetDir.backRight,
          FA: offsetDir.backLeft,
          F9: offsetDir.frontLeft,
        };

        const offsetCleaves = cleaves.map((id) => rotateDir(cleaveToOffsetDir[id] ?? 0));

        // Front is rotated to out.
        const cloneOffsetCleaveToDirection = {
          [offsetDir.frontRight]: output.in!(),
          [offsetDir.backRight]: output.out!(),
          [offsetDir.backLeft]: output.out!(),
          [offsetDir.frontLeft]: output.in!(),
        };

        // Front is rotated to north.
        const bossOffsetCleaveToDirection = {
          [offsetDir.frontRight]: output.dirSW!(),
          [offsetDir.backRight]: output.dirNW!(),
          [offsetDir.backLeft]: output.dirNE!(),
          [offsetDir.frontLeft]: output.dirSE!(),
        };

        const offsetCleaveToDirection = isClone
          ? cloneOffsetCleaveToDirection
          : bossOffsetCleaveToDirection;

        data.calledSeekerSwords = true;
        const dirs = offsetCleaves.map((dir) => offsetCleaveToDirection[dir]);
        return output.quadruple!({ dir1: dirs[0], dir2: dirs[1], dir3: dirs[2], dir4: dirs[3] });
      },
      outputStrings: {
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
        in: Outputs.in,
        out: Outputs.out,
        // Backup for bad patterns.
        dirNE: Outputs.dirNE,
        dirSE: Outputs.dirSE,
        dirSW: Outputs.dirSW,
        dirNW: Outputs.dirNW,

        double: {
          en: '${dir1} > ${dir2}',
          de: '${dir1} > ${dir2}',
          fr: '${dir1} > ${dir2}',
          ja: '${dir1} > ${dir2}',
          cn: '${dir1} > ${dir2}',
          ko: '${dir1} > ${dir2}',
        },
        quadruple: {
          en: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          de: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          fr: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          ja: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          cn: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          ko: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Swath',
      type: 'StartsUsing',
      // This is an early warning on the Verdant Path cast.
      netRegex: { source: 'Trinity Seeker', id: '5A98', capture: false },
      response: Responses.goFrontBack('info'),
      // Merciful arc can be skipped, so if we get here, the next headmarker is burning chains.
      // If we have seen merciful arc, this is a noop.
      run: (data) => data.firstUnknownHeadmarker = headmarker.burningChains,
    },
    {
      id: 'DelubrumSav Seeker Act Of Mercy',
      type: 'StartsUsing',
      // This is an early warning on the Verdant Path cast.
      netRegex: { source: 'Trinity Seeker', id: '5A97', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // "Intercardinals" may confuse people between absolute and relative,
          // so add in the "of boss" just to be extra clear.
          en: 'Go Intercardinal of Boss',
          de: 'Geh in eine Intercardinale Himmelsrichtung vom Boss',
          fr: 'Allez en intercardinal du boss',
          ja: 'ボスの斜めへ',
          cn: '去Boss的对角线方向',
          ko: '보스 비스듬히 피해요',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Iron Impact',
      type: 'StartsUsing',
      // This is an early warning on the Verdant Path cast.
      netRegex: { source: 'Trinity Seeker', id: '5A99', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Behind For Line Stack',
          de: 'Geh hinter den Boss für Linien-Stack',
          fr: 'Passez derrière pour le package en ligne',
          ja: '後ろに直線頭割りを準備',
          cn: '去后方，准备直线分摊',
          ko: '보스 뒤에서 뭉쳐요 (직선)',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Onslaught Buster',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5AD5', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          avoidTankCleave: Outputs.avoidTankCleave,
          sharedTankBuster: Outputs.sharedTankbuster,
        };

        if (data.role === 'tank' || data.role === 'healer')
          return { alertText: output.sharedTankBuster!() };
        return { infoText: output.avoidTankCleave!() };
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Onslaught Solo',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5AD6', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Solo Tank Cleave',
          de: 'Solo Tank Cleave',
          fr: 'Tank cleave solo',
          ja: 'ソロタンクバスター',
          cn: '单吃死刑顺劈',
          ko: '혼자 맞는 탱크클레브',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Blade Out',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5ABE', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hide Behind Barricade',
          de: 'Hinter den Barrikaden verstecken',
          fr: 'Cachez-vous derrière la barricade',
          ja: '柵の後ろに',
          cn: '躲在栅栏后',
          ko: '울타리 뒤에 숨어요',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Blade Knockback',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Seeker', id: '5ABF', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback Into Barricade',
          de: 'Rückstoß in die Barrikaden',
          fr: 'Poussée contre la barricade',
          ja: '柵に吹き飛ばされる',
          cn: '击退到栅栏上',
          ko: '울타리로 넉백',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Merciful Moon',
      type: 'StartsUsing',
      // No cast time on this in savage, but Merciful Blooms cast is a ~3s warning.
      netRegex: { source: 'Trinity Seeker', id: '5ACA', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Look Away From Orb',
          de: 'Schau weg vom Orb',
          fr: 'Ne regardez pas l\'orbe',
          ja: '玉に背を向ける',
          cn: '背对白球',
          ko: '구슬 보면 안되요',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Merciful Blooms',
      type: 'Ability',
      // Call this on the ability of Merciful Moon, it starts casting much earlier.
      netRegex: { source: 'Aetherial Orb', id: '5AC9', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away From Purple',
          de: 'Schau weg von Lila',
          fr: 'Éloignez-vous du violet',
          ja: '花に避ける',
          cn: '远离紫花',
          ko: '꽃 장판 피해요',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Dead Iron',
      type: 'Tether',
      // Headmarkers are randomized, so use the tether instead.
      netRegex: { target: 'Trinity Seeker', id: '01DB' },
      condition: (data, matches) => matches.source === data.me,
      alarmText: (_data, _matches, output) => output.earthshaker!(),
      outputStrings: {
        earthshaker: {
          en: 'Earthshaker, away from boss',
          de: 'Erdstoß, weg vom Boss',
          fr: 'Secousse, éloignez-vous du boss',
          ja: 'アースシェイカー、ボスから離れる',
          cn: '大地摇动，远离Boss',
          ko: '어스세이커, 보스에게서 떨어져요',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Iron Splitter',
      type: 'StartsUsing',
      netRegex: { source: ['Trinity Seeker', 'Seeker Avatar'], id: '5AC0' },
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
          return;
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
          de: 'Blauer Stein',
          fr: 'Pierre bleue',
          ja: '青い床へ',
          cn: '去蓝色',
          ko: '파랑 장판으로',
        },
        goWhite: {
          en: 'White Sand',
          de: 'Weißer Sand',
          fr: 'Sable blanc',
          ja: '白い床へ',
          cn: '去白色',
          ko: '하얀 장판으로',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Comet Direction',
      type: 'Ability',
      netRegex: { source: 'Seeker Avatar', id: '5AD7' },
      condition: (data, matches) => {
        data.seekerCometIds ??= [];
        data.seekerCometIds.push(parseInt(matches.sourceId, 16));
        return data.seekerCometIds.length === 2;
      },
      delaySeconds: 0.5,
      // In case this hits multiple people.
      // (Note: Suppressed status is checked before condition, but the field evaluated after.)
      suppressSeconds: 0.5,
      promise: async (data) => {
        // The avatars get moved right before the comets, and the position data
        // is stale in the combat log.  :C
        const cometData = await callOverlayHandler({
          call: 'getCombatants',
          ids: data.seekerCometIds?.slice(0, 2),
        });

        if (cometData === null) {
          console.error('Baleful Comet: null cometData');
          return;
        }
        if (!cometData.combatants.length) {
          console.error('Baleful Comet: empty combatants');
          return;
        }
        if (cometData.combatants.length !== 2) {
          console.error(`Baleful Comet: weird length: ${cometData.combatants.length}`);
          return;
        }

        data.seekerCometData = cometData.combatants;
      },
      infoText: (data, _matches, output) => {
        if (!data.seekerCometData)
          throw new UnreachableCode();
        const cometIds = data.seekerCometIds;
        if (!cometIds)
          throw new UnreachableCode();

        // The returned data does not come back in the same order.
        // Sort by the original order.
        data.seekerCometData.sort((a, b) => {
          return cometIds.indexOf(a.ID ?? 0) - cometIds.indexOf(b.ID ?? 0);
        });

        const [firstDir, secondDir] = data.seekerCometData.map((comet) => {
          const x = comet.PosX - seekerCenterX;
          const y = comet.PosY - seekerCenterY;
          const dir = Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
          return dir;
        });
        if (firstDir === undefined || secondDir === undefined)
          throw new UnreachableCode();

        let rotateStr = output.unknown!();
        let safeDir;
        if (Math.abs(secondDir - firstDir) === 1) {
          rotateStr = secondDir > firstDir ? output.clockwise!() : output.counterclockwise!();
          safeDir = (secondDir > firstDir ? firstDir - 1 + 8 : firstDir + 1) % 8;
        } else {
          // edge case where one dir is 0 and the other is 7.
          rotateStr = firstDir === 7 ? output.clockwise!() : output.counterclockwise!();
          safeDir = firstDir === 7 ? safeDir = 6 : safeDir = 1;
        }

        const initialDir = [
          'north',
          'northeast',
          'east',
          'southeast',
          'south',
          'southwest',
          'west',
          'northwest',
        ][safeDir];
        if (initialDir === undefined)
          throw new UnreachableCode();

        return output.text!({ dir: output[initialDir]!(), rotate: rotateStr });
      },
      outputStrings: {
        unknown: Outputs.unknown,
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
        clockwise: {
          en: 'Clockwise',
          de: 'Im Uhrzeigersinn',
          fr: 'Sens horaire',
          ja: '時針回り',
          cn: '顺时针',
          ko: '시계방향',
        },
        counterclockwise: {
          en: 'Counter-clock',
          de: 'Gegen den Uhrzeigersinn',
          fr: 'Anti-horaire',
          ja: '逆時針回り',
          cn: '逆时针',
          ko: '반시계방향',
        },
        text: {
          en: 'Go ${dir}, then ${rotate}',
          de: 'Geh nach ${dir}, danach ${rotate}',
          fr: 'Direction ${dir}, puis ${rotate}',
          ja: '${dir}へ、そして${rotate}',
          cn: '去${dir}，然后${rotate}旋转',
          ko: '${dir}으로 가고, ${rotate}',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Baleful Comet Cleanup',
      type: 'Ability',
      netRegex: { source: 'Seeker Avatar', id: '5AD7', capture: false },
      delaySeconds: 10,
      suppressSeconds: 10,
      run: (data) => delete data.seekerCometIds,
    },
    {
      id: 'DelubrumSav Seeker Burning Chains',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return false;
        return getHeadmarkerId(data, matches) === headmarker.burningChains;
      },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chain on YOU',
          de: 'Kette auf DIR',
          fr: 'Chaîne sur VOUS',
          ja: '自分に鎖',
          cn: '锁链点名',
          ko: '내게 체인',
        },
      },
    },
    {
      id: 'DelubrumSav Seeker Burning Chains Move',
      type: 'GainsEffect',
      netRegex: { effectId: '301' },
      condition: Conditions.targetIsYou(),
      response: Responses.breakChains(),
    },
    {
      id: 'DelubrumSav Seeker Merciful Arc',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarker.mercifulArc,
      response: Responses.tankCleave(),
    },
    {
      id: 'DelubrumSav Dahu Shockwave',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: ['5770', '576F'] },
      // There's a 3s slow windup on the first, then a 1s opposite cast.
      suppressSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '5770')
          return output.leftThenRight!();
        return output.rightThenLeft!();
      },
      outputStrings: {
        leftThenRight: {
          en: 'Left, Then Right',
          de: 'Links, dann Rechts',
          fr: 'À gauche, puis à droite',
          ja: '左 => 右',
          cn: '左 => 右',
          ko: '왼쪽 🔜 오른쪽',
        },
        rightThenLeft: {
          en: 'Right, Then Left',
          de: 'Rechts, dann Links',
          fr: 'À droite, puis à gauche',
          ja: '右 => 左',
          cn: '右 => 左',
          ko: '오른쪽 🔜 왼쪽',
        },
      },
    },
    {
      id: 'DelubrumSav Dahu Hot Charge',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '5773', capture: false },
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.seenHotCharge)
          return output.oneOrTwoCharges!();
        return output.followSecondCharge!();
      },
      run: (data) => {
        data.seenHotCharge = true;
        data.firstUnknownHeadmarker = headmarker.spitFlame1;
      },
      outputStrings: {
        oneOrTwoCharges: {
          en: 'Follow One or Two Charges',
          de: 'Folge dem 1. oder 2. Ansturm',
          fr: 'Suivez 1 ou 2 charges',
          ja: '1回目や2回目の突進に追う',
          cn: '紧跟第一次或第二次冲锋',
          ko: '첫번째나 두번째 돌진 따라가요',
        },
        followSecondCharge: {
          en: 'Follow Second Charge',
          de: 'Folge dem 2. Ansturm',
          fr: 'Suivez la deuxième charge',
          ja: '2回目の突進に追う',
          cn: '紧跟第二次冲锋',
          ko: '두번째 돌진 따라가요',
        },
      },
    },
    {
      id: 'DelubrumSav Dahu Spit Flame',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return false;
        const id = getHeadmarkerId(data, matches);
        return id >= headmarker.spitFlame1 && id <= headmarker.spitFlame4;
      },
      durationSeconds: 7,
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        const num = parseInt(id, 16) - parseInt(headmarker.spitFlame1, 16) + 1;
        const outputMap: { [marker: number]: string } = {
          1: output.one!(),
          2: output.two!(),
          3: output.three!(),
          4: output.four!(),
        };
        return outputMap[num];
      },
      outputStrings: {
        one: Outputs.num1,
        two: Outputs.num2,
        three: Outputs.num3,
        four: Outputs.num4,
      },
    },
    {
      id: 'DelubrumSav Dahu Feral Howl',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '5767', capture: false },
      alertText: (_data, _matches, output) => output.knockback!(),
      outputStrings: {
        knockback: {
          en: 'Knockback to safe spot',
          de: 'Rückstoß in den sicheren Bereich',
          fr: 'Poussée en zone safe',
          ja: '安置へノックバック',
          cn: '击退到安全点',
          ko: '안전한 곳으로 넉백',
        },
      },
    },
    {
      id: 'DelubrumSav Dahu Flare',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return false;
        const id = getHeadmarkerId(data, matches);
        return id === headmarker.flare;
      },
      run: (data) => data.hystericFlare = true,
    },
    {
      id: 'DelubrumSav Dahu Hysteric Assault',
      type: 'StartsUsing',
      netRegex: { source: 'Dahu', id: '5778', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          knockbackNoFlare: {
            en: 'Knockback (no flare)',
            de: 'Rückstoß (keine Flare)',
            fr: 'Poussée (pas de brasier)',
            ja: 'ノックバック (フレアなし)',
            cn: '击退 (无核爆)',
            ko: '넉백 (플레어 없음)',
          },
          knockbackWithFlare: {
            en: 'Flare + Knockback (get away)',
            de: 'Flare + Rückstoß (geh weg)',
            fr: 'Brasier + poussée (éloignez-vous)',
            ja: 'フレア + ノックバック (離れる)',
            cn: '核爆 + 击退 (远离)',
            ko: '플레어 + 넉백 (멀리)',
          },
        };

        if (data.hystericFlare)
          return { alarmText: output.knockbackWithFlare!() };
        return { alertText: output.knockbackNoFlare!() };
      },
      run: (data) => delete data.hystericFlare,
    },
    {
      id: 'DelubrumSav Guard Blood And Bone Warrior and Knight',
      type: 'StartsUsing',
      // 5831 from Queen's Warrior
      // 5821 from Queen's Knight
      netRegex: {
        source: ['Queen\'s Warrior', 'Queen\'s Knight'],
        id: ['5831', '5821'],
        capture: false,
      },
      suppressSeconds: 1,
      response: Responses.aoe(),
    },
    {
      id: 'DelubrumSav Guard Queen\'s Shot and Blood And Bone Soldier',
      type: 'StartsUsing',
      // 5854 from Queen's Gunner
      // 5841 from Queen's Soldier
      netRegex: {
        source: ['Queen\'s Gunner', 'Queen\'s Soldier'],
        id: ['5854', '5841'],
        capture: false,
      },
      suppressSeconds: 1,
      response: Responses.aoe(),
    },
    {
      id: 'DelubrumSav Guard Optimal Offensive Sword',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '5819', capture: false },
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Take Outside Bombs',
          de: 'Nimm die äußeren Bomben',
          fr: 'Prenez les bombes extérieur',
          ja: '外の爆弾を取る',
          cn: '吃外面的炸弹',
          ko: '바깥쪽의 폭탄 사용해요',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Optimal Offensive Shield',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '581A', capture: false },
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback Away From Sphere',
          de: 'Rückstoß weg von der Sphere',
          fr: 'Poussée loin de la sphère',
          ja: 'ノックバック、玉から離れる',
          cn: '击退，远离球',
          ko: '구슬 쪽에서 넉백',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Optimal Play Sword',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '5816', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out, Avoid Cleaves',
          de: 'Raus, weiche den Cleaves aus',
          fr: 'À l\'extérieur, évitez les cleaves',
          ja: '外へ、範囲攻撃注意',
          cn: '远离，躲避顺劈',
          ko: '밖으로, 클레브 피해요',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Optimal Play Shield',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Knight', id: '5817', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In, Avoid Cleaves',
          de: 'Rein, weiche den Cleaves aus',
          fr: 'À l\'intérieur, évitez les cleaves',
          ja: '中へ、範囲攻撃注意',
          cn: '靠近，躲避顺劈',
          ko: '안으로, 클레브 피해요',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Yellow Tether',
      type: 'Tether',
      netRegex: {
        source: 'Queen\'s Warrior',
        target: 'Queen\'s Knight',
        id: '0088',
        capture: false,
      },
      // Yellow tether between Knight and Warrior gives them a Physical Vulnerability Down debuff.
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Remove yellow; apply purple',
          de: 'Entferne Gelb; nimm Lila',
          fr: 'Retirez le jaune; appliquez le violet',
          ja: 'スチールを切り、スペルを使用',
          cn: '点掉钢刺，使用铸魔',
          ko: '스틸은 지우고, 스펠 사용',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Purple Tether',
      type: 'Tether',
      netRegex: {
        source: 'Queen\'s Warrior',
        target: 'Queen\'s Knight',
        id: '0089',
        capture: false,
      },
      // Yellow tether between Knight and Warrior gives them a Physical Vulnerability Down debuff.
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Remove purple; apply yellow',
          de: 'Entferne Lila; nimm Gelb',
          fr: 'Retirez le violet; appliquez le jaune',
          ja: 'スペルを切り、スチールを使用',
          cn: '点掉铸魔，使用钢刺',
          ko: '스펠은 지우고, 스틸 사용',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Boost',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Warrior', id: '582D', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dispel Warrior Boost',
          de: 'Reinige Kriegerin Buff',
          fr: 'Dissipez le boost du Guerrier',
          ja: 'ウォリアーにディスペル',
          cn: '驱魔 > 战士',
          ko: '워리어 부스트 디스펠',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Higher Power',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '5853', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dispel Gun Turrets',
          de: 'Reinige Schützetürme',
          fr: 'Dissipez la Tourelle dirigée',
          ja: 'ガンナータレットにディスペル',
          cn: '驱魔 > 炮台',
          ko: '건 터렛 디스펠',
        },
      },
    },
    {
      id: 'DelubrumSav Guard/Queen Bombslinger',
      type: 'StartsUsing',
      // 5AFE = Bombslinger during Queen's Guard, 5B3F = Bombslinger during The Queen
      netRegex: { source: 'Queen\'s Warrior', id: ['5AFE', '5B3F'], capture: false },
      run: (data) => data.tetherIsBombslinger = true,
    },
    {
      id: 'DelubrumSav Guard/Queen Bomb Reversal',
      type: 'Tether',
      netRegex: { target: 'Queen\'s Warrior', id: '0010', capture: false },
      suppressSeconds: 1,
      run: (data) => data.tetherOnBomb = true,
    },
    {
      id: 'DelubrumSav Guard/Queen Personal Reversal',
      type: 'Tether',
      netRegex: { target: 'Queen\'s Warrior', id: '0087' },
      condition: (data, matches) => matches.source === data.me,
      run: (data) => data.tetherOnSelf = true,
    },
    {
      id: 'DelubrumSav Guard/Queen Reversal Of Forces',
      type: 'StartsUsing',
      // Tethers to self (and bombs, if bombslinger) come out just before this starts casting.
      // This is used in two places, both for Bombslinger and the Winds of Weight.
      // 5829 = Reversal Of Forces during Queen's Guard, 5A0E = Reversal Of Forces during The Queen
      // TODO: should we differentiate big/small/wind/lightning with alert vs info?
      netRegex: { source: 'Queen\'s Warrior', id: ['5829', '5A0E'], capture: false },
      durationSeconds: 11,
      alertText: (data, _matches, output) => {
        if (data.tetherIsBombslinger) {
          if (data.tetherOnBomb)
            return data.tetherOnSelf ? output.bigWithTether!() : output.smallNoTether!();
          return data.tetherOnSelf ? output.smallWithTether!() : output.bigNoTether!();
        }

        return data.tetherOnSelf ? output.windTether!() : output.lightningNoTether!();
      },
      run: (data) => {
        delete data.tetherIsBombslinger;
        delete data.tetherOnSelf;
        delete data.tetherOnBomb;
      },
      outputStrings: {
        windTether: {
          en: 'Wind (tethered)',
          de: 'Wind (Verbindung)',
          fr: 'Vent (lié)',
          ja: '風 (線)',
          cn: '风 (连线)',
          ko: '녹색 바람 (줄)',
        },
        lightningNoTether: {
          en: 'Lightning (no tether)',
          de: 'Blitz (keine Verbindung)',
          fr: 'Lumière (non liée)',
          ja: '雷 (線なし)',
          cn: '雷 (无连线)',
          ko: '보라 번개 (줄 없음)',
        },
        bigNoTether: {
          en: 'Big Bomb (no tether)',
          de: 'Große Bombe (keine Verbindung)',
          fr: 'Grosse bombe (non liée)',
          ja: '大きい爆弾 (線なし)',
          cn: '大炸弹 (无连线)',
          ko: '큰 폭탄 (줄 없음)',
        },
        bigWithTether: {
          en: 'Big Bomb (tethered)',
          de: 'Große Bombe (Verbindung)',
          fr: 'Grosse bombe (liée)',
          ja: '大きい爆弾 (線)',
          cn: '大炸弹 (连线)',
          ko: '큰 폭탄 (줄)',
        },
        smallNoTether: {
          en: 'Small Bomb (no tether)',
          de: 'Kleine Bombe (keine Verbindung)',
          fr: 'Petite bombe (non liée)',
          ja: '小さい爆弾 (線なし)',
          cn: '小炸弹 (无连线)',
          ko: '작은 폭탄 (줄 없음)',
        },
        smallWithTether: {
          en: 'Small Bomb (tethered)',
          de: 'Kleine Bombe (Verbindung)',
          fr: 'Petite bombe (liée)',
          ja: '小さい爆弾 (線)',
          cn: '小炸弹 (连线)',
          ko: '작은 폭탄 (줄)',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Fiery Portent',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Soldier', id: '583F' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      durationSeconds: 5.5,
      response: Responses.stopEverything(),
    },
    {
      id: 'DelubrumSav Guard Icy Portent',
      type: 'StartsUsing',
      // Assuming you need to move for 3 seconds (duration of Pyretic from Fiery Portent)
      netRegex: { source: 'Queen\'s Soldier', id: '5840' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      durationSeconds: 5.5,
      response: Responses.moveAround('alert'),
    },
    {
      id: 'DelubrumSav Guard Above Board Warning',
      type: 'StartsUsing',
      // 5826 in Guard fight, 5A0B in Queen fight.
      netRegex: { source: 'Queen\'s Warrior', id: ['5826', '5A0B'], capture: false },
      delaySeconds: 9.5,
      response: Responses.moveAway(),
    },
    {
      id: 'DelubrumSav Guard Queen\'s Shot',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '584C', capture: false },
      // This has a 7 second cast time.
      delaySeconds: 3.5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // Hard to say "point the opening in the circle around you at the gunner" succinctly.
          en: 'Point at the Gunner',
          de: 'Auf den Schützen zeigen',
          fr: 'Pointez sur le Fusiller',
          ja: '切り目をガンナーに向く',
          cn: '将缺口对准枪手',
          ko: '거너 쪽으로 향해요',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Queen\'s Shot',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Gunner', id: '5A2D', capture: false },
      // This has a 7 second cast time.
      delaySeconds: 3.5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // This gunner is always in the northwest during Queen, vs in Guard where it is tankable.
          en: 'Point at the Gunner (in northwest)',
          de: 'Auf den Schützen zeigen (im Nord-Westen)',
          fr: 'Pointez sur le Fusiller (au nord-ouest)',
          ja: '切り目を (北西) ガンナーに向く',
          cn: '将缺口对准西北(左上)枪手',
          ko: '(북서쪽) 거너 쪽으로 향해요',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Queen\'s Shot Followup',
      type: 'Ability',
      netRegex: { source: 'Queen\'s Gunner', id: ['584C', '5A2D'], capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Point at the Turret',
          de: 'Auf den Geschützturm zeigen',
          fr: 'Pointez sur la Tourelle',
          ja: '切り目をタレットに向く',
          cn: '将缺口对准炮台',
          ko: '터렛 쪽으로 향해요',
        },
      },
    },
    {
      id: 'DelubrumSav Guard Coat of Arms',
      type: 'StartsUsing',
      netRegex: { source: 'Aetherial Ward', id: '5820' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2.5,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stop attacking',
          de: 'Angriffe stoppen',
          fr: 'Arrêtez d\'attaquer',
          ja: '攻撃禁止',
          cn: '停止攻击',
          ko: '공격 금지',
        },
      },
    },
    {
      id: 'DelubrumSav Phantom Malediction Of Agony',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '57BD', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'DelubrumSav Phantom Weave Miasma',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '57B2', capture: false },
      infoText: (data, _matches, output) => {
        data.weaveCount = (data.weaveCount || 0) + 1;
        if (data.weaveCount === 1)
          return output.firstWeave!();
        else if (data.weaveCount === 2)
          return output.secondWeave!();
      },
      outputStrings: {
        firstWeave: {
          en: 'Go North (donut bottom/circle top)',
          de: 'Geh nach Norden (Donut unten/Kreise oben)',
          fr: 'Allez au nord (donut en bas/cercle en haut)',
          ja: '北へ (下にドーナツ/上に円)',
          cn: '去下环上圆列北侧',
          ko: '북쪽으로 (도넛이 아래, 동글이 위)',
        },
        secondWeave: {
          en: 'Stay South (square bottom/circle top)',
          de: 'Geh nach Süden (Viereck unten/Kreise oben)',
          fr: 'Restez au sud (carré en bas/cercle en haut)',
          ja: '南へ（下に四角/上に円）',
          cn: '待在下方上圆列南侧',
          ko: '남쪽으로 (사각이 아래, 동글이 위)',
        },
      },
    },
    {
      id: 'DelubrumSav Phantom Stuffy Wrath',
      type: 'AddedCombatant',
      // Spawns after 57BA Summon, either North (-403.5) or South (-344.5)
      // Casts 57C2 Undying Hatred
      netRegex: { npcNameId: '9756' },
      durationSeconds: 5,
      suppressSeconds: 1,
      response: (_data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          goSouth: {
            en: 'Go South; Knockback to Glowing Donut',
            de: 'Geh nach Süden; Rückstoß zum leuchtenden Donut',
            fr: 'Allez au sud; Poussée vers le donut embrasé',
            ja: '南へ、光ってるドーナツへノックバック',
            cn: '去发光环形列南侧',
            ko: '남쪽으로, 빛나는 도넛으로 넉백',
          },
          goNorth: {
            en: 'Go North; Knockback from Glowing Circle',
            de: 'Geh nach Norden; Rückstoß zum leuchtenden Kreis',
            fr: 'Allez au nord; Poussée depuis le cercle verdâtre',
            ja: '北へ、光ってる円からノックバック',
            cn: '去发光圆形列北侧',
            ko: '북쪽으로, 빛나는 동글에서 넉백',
          },
        };

        // The sum of the two possible spawn locations divided by two.
        if (parseFloat(matches.y) < -374)
          return { alertText: output.goNorth!() };
        return { alertText: output.goSouth!() };
      },
    },
    {
      id: 'DelubrumSav Phantom Vile Wave',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '57BF', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'DelubrumSav Phantom Ice Spikes',
      type: 'StartsUsing',
      // Ice Spikes (effectId: '9E0') reflects damage, wait for Dispel
      // Buff expires about 16 seconds on first cast, ~8 seconds later casts)
      netRegex: { source: 'Bozjan Phantom', id: '57BC', capture: false },
      delaySeconds: 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stop Attacking, Dispel Ice Spikes',
          de: 'Angriffe stoppen, entferne Eisstachel',
          fr: 'Arrêtez d\'attaquer, dissipez les pics de glace',
          ja: '攻撃停止、ファントムにディスペル',
          cn: '停手，驱魔 > 幻灵',
          ko: '공격 그만, 보스 디스펠',
        },
      },
    },
    {
      id: 'DelubrumSav Phantom Excruciation',
      type: 'StartsUsing',
      netRegex: { source: 'Bozjan Phantom', id: '57BE' },
      condition: tankBusterOnParty,
      response: Responses.tankBuster(),
    },
    {
      id: 'DelubrumSav Avowed Wrath Of Bozja',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Avowed', id: '594E', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          avoidTankCleave: Outputs.avoidTankCleave,
          sharedTankBuster: Outputs.sharedTankbuster,
        };

        if (data.role === 'tank' || data.role === 'healer')
          return { alertText: output.sharedTankBuster!() };
        return { infoText: output.avoidTankCleave!() };
      },
    },
    {
      id: 'DelubrumSav Avowed Fury Of Bozja',
      type: 'StartsUsing',
      // Allegiant Arsenal 5987 = staff (out), followed up with Fury of Bozja 594C
      netRegex: { source: 'Trinity Avowed', id: '5987', capture: false },
      response: Responses.getOut(),
      run: (data) => data.avowedPhase = 'staff',
    },
    {
      id: 'DelubrumSav Avowed Flashvane',
      type: 'StartsUsing',
      // Allegiant Arsenal 5986 = bow (get behind), followed up by Flashvane 594B
      netRegex: { source: 'Trinity Avowed', id: '5986', capture: false },
      response: Responses.getBehind(),
      run: (data) => data.avowedPhase = 'bow',
    },
    {
      id: 'DelubrumSav Avowed Infernal Slash',
      type: 'StartsUsing',
      // Allegiant Arsenal 5985 = sword (get front), followed up by Infernal Slash 594A
      netRegex: { source: 'Trinity Avowed', id: '5985', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.avowedPhase = 'sword',
      outputStrings: {
        text: {
          en: 'Get In Front',
          de: 'Geh vor den Boss',
          fr: 'Passez devant',
          ja: 'ボスの正面へ',
          cn: '去Boss正面',
          ko: '보스 앞으로',
        },
      },
    },
    {
      id: 'DelubrumSav Avowed Hot And Cold Cleanup',
      type: 'StartsUsing',
      // On Hot and Cold casts.  This will clean up any lingering forced march from bow phase 1.
      netRegex: { source: 'Trinity Avowed', id: ['5BB0', '5BAF', '597B'], capture: false },
      run: (data) => {
        delete data.currentTemperature;
        delete data.currentBrand;
        delete data.forcedMarch;
        delete data.blades;
      },
    },
    {
      id: 'DelubrumSav Avowed Temperature Collect',
      type: 'GainsEffect',
      // These come from Environment, Trinity Avowed, Avowed Avatar, Swirling Orb
      // 89C Normal
      // 89D Running Hot: +1
      // 8DC Running Cold: -1
      // 8E2 Running Cold: -2
      // 8A4 Running Hot: +2
      netRegex: { effectId: ['89C', '89D', '8DC', '8E2', '8A4'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const temperature: { [id: string]: number } = {
          '89C': 0,
          '89D': 1,
          '8DC': -1,
          '8E2': -2,
          '8A4': 2,
        };
        data.currentTemperature = temperature[matches.effectId.toUpperCase()];
      },
    },
    {
      id: 'DelubrumSav Avowed Brand Collect',
      type: 'GainsEffect',
      // These come from Environment, E0000000
      // 8E5 Hot Brand: +1
      // 8F3 Hot Brand: +2
      // 8F4 Cold Brand: +1
      // 8F8 Cold Brand: +2
      netRegex: { effectId: ['8E5', '8F3', '8F4', '8F8'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const brand: { [id: string]: number } = {
          '8E5': 1,
          '8F3': 2,
          '8F4': -1,
          '8F8': -2,
        };
        data.currentBrand = brand[matches.effectId.toUpperCase()];
      },
    },
    {
      id: 'DelubrumSav Avowed March Collect',
      type: 'GainsEffect',
      // 50D Forward March
      // 50E About Face
      // 50F Left Face
      // 510 Right Face
      netRegex: { effectId: ['50D', '50E', '50F', '510'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.forcedMarch = matches.effectId.toUpperCase(),
    },
    {
      id: 'DelubrumSav Avowed Blade of Entropy Collect',
      type: 'StartsUsing',
      // Used to get whether left or right cleave is happening and temperature value
      // Trinity Avowed or Avowed Avatar cast these pairs
      // +1 Cleaves
      // 5942 = right cleave, heat (1) paired with 5944
      // 5943 = right cleave, cold (1) paired with 5945
      // 5944 = right cleave, heat (1) paired with 5942
      // 5945 = right cleave, cold (1) paired with 5943
      //
      // 5946 = left cleave, cold (1) paired with 5948
      // 5947 = left cleave, heat (1) paired with 5949
      // 5948 = left cleave, cold (1) paired with 5946
      // 5949 = left cleave, heat (1) paired with 5947
      //
      // +2 Cleaves
      // 5956 = right cleave, heat (2) paired with 5958
      // 5957 = right cleave, cold (2) paired with 5959
      // 5958 = right cleave, heat (2) paired with 5956
      // 5959 = right cleave, cold (2) paired with 5957
      //
      // 595A = left cleave heat (2) paired with 595C
      // 595B = left cleave cold (2) paired with 595D
      // 595C = left cleave heat (2) paired with 595A
      // 595D = left cleave cold (2) paired with 595B
      netRegex: {
        source: ['Trinity Avowed', 'Avowed Avatar'],
        id: ['5942', '5943', '5946', '5947', '5956', '5957', '595A', '595B'],
      },
      run: (data, matches) => {
        data.blades ??= {};
        data.blades[parseInt(matches.sourceId, 16)] = matches.id.toUpperCase();
      },
    },
    {
      id: 'DelubrumSav Avowed Hot And Cold Shimmering Shot',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Avowed', id: '597F', capture: false },
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        const currentBrand = data.currentBrand ?? 0;
        const currentTemperature = data.currentTemperature ?? 0;
        const effectiveTemperature = (currentTemperature + currentBrand).toString();

        const tempToOutput: { [temp: string]: string } = {
          '-2': output.plusTwo!(),
          '-1': output.plusOne!(),
          '0': output.emptySpot!(),
          '1': output.minusOne!(),
          '2': output.minusTwo!(),
        };
        const arrowStr = effectiveTemperature in tempToOutput
          ? tempToOutput[effectiveTemperature]
          : output.unknownTemperature!();

        const marchStrMap: { [id: string]: string } = {
          '50D': output.forwards!(),
          '50E': output.backwards!(),
          '50F': output.left!(),
          '510': output.right!(),
        };

        if (data.forcedMarch !== undefined) {
          const marchStr = marchStrMap[data.forcedMarch];
          return output.marchToArrow!({ arrow: arrowStr, dir: marchStr });
        }
        return output.followArrow!({ arrow: arrowStr });
      },
      outputStrings: {
        plusTwo: {
          en: '+2 Heat Arrow',
          de: '+2 Heiß-Pfeile',
          fr: 'La flèche de chaleur +2',
          ja: '炎属性+2',
          cn: '火+2箭',
          ko: '+2 불 화살',
        },
        plusOne: {
          en: '+1 Heat Arrow',
          de: '+1 Heiß-Pfeile',
          fr: 'La flèche de chaleur +1',
          ja: '炎属性+1',
          cn: '火+1箭',
          ko: '+1 불 화살',
        },
        emptySpot: {
          en: 'Empty Spot',
          de: 'Leeres Feld',
          fr: 'L\'emplacement vide',
          ja: 'そのままにする',
          cn: '空白',
          ko: '빈 자리',
        },
        minusOne: {
          en: '-1 Cold Arrow',
          de: '-1 Kalt-Pfeile',
          fr: 'La flèche de froid -1',
          ja: '氷属性-1',
          cn: '冰-1箭',
          ko: '-1 얼음 화살',
        },
        minusTwo: {
          en: '-2 Cold Arrow',
          de: '-2 Kalt-Pfeile',
          fr: 'La flèche de froid -2',
          ja: '氷属性-2',
          cn: '冰-2箭',
          ko: '-2 얼음 화살',
        },
        unknownTemperature: {
          en: 'Opposite Arrow',
          de: 'Entgegengesetze Pfeile',
          fr: 'La flèche de l\'élément opposé',
          ja: '体温と逆のあみだ',
          cn: '相反温度的箭',
          ko: '반대속성 화살',
        },
        forwards: {
          en: 'forwards',
          de: 'Vorwärts',
          fr: 'vers l\'avant',
          ja: '前',
          cn: '前',
          ko: '앞',
        },
        backwards: {
          en: 'backwards',
          de: 'Rückwärts',
          fr: 'vers l\'arrière',
          ja: '後ろ',
          cn: '后',
          ko: '뒤',
        },
        left: {
          en: 'left',
          de: 'Links',
          fr: 'à gauche',
          ja: '左',
          cn: '左',
          ko: '왼쪽',
        },
        right: {
          en: 'right',
          de: 'Rechts',
          fr: 'à droite',
          ja: '右',
          cn: '右',
          ko: '오른쪽',
        },
        followArrow: {
          en: 'Follow ${arrow}',
          de: 'Folge ${arrow}',
          fr: 'Suivez ${arrow}',
          ja: '${arrow}に従う',
          cn: '接${arrow}',
          ko: '${arrow}쪽으로',
        },
        marchToArrow: {
          en: 'March ${dir} to ${arrow}',
          de: 'Marchiere ${dir} zum ${arrow}',
          fr: 'Marchez ${dir} de ${arrow}',
          ja: '強制移動: ${dir} > ${arrow}',
          cn: '强制移动：${dir} > ${arrow}',
          ko: '강제이동: ${dir} > ${arrow}',
        },
      },
    },
    {
      id: 'DelubrumSav Avowed Hot And Cold Freedom Of Bozja',
      type: 'StartsUsing',
      netRegex: { source: 'Trinity Avowed', id: '597C', capture: false },
      delaySeconds: 7,
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        const currentBrand = data.currentBrand ? data.currentBrand : 0;
        const currentTemperature = data.currentTemperature ? data.currentTemperature : 0;
        const effectiveTemperature = (currentTemperature + currentBrand).toString();

        const tempToOutput: { [temp: string]: string } = {
          '-2': output.plusTwo!(),
          '-1': output.plusOne!(),
          '1': output.minusOne!(),
          '2': output.minusTwo!(),
        };
        const meteorStr = effectiveTemperature in tempToOutput
          ? tempToOutput[effectiveTemperature]
          : output.unknownTemperature!();

        const marchStrMap: { [id: string]: string } = {
          '50D': output.forwards!(),
          '50E': output.backwards!(),
          '50F': output.left!(),
          '510': output.right!(),
        };

        if (data.forcedMarch !== undefined) {
          const marchStr = marchStrMap[data.forcedMarch];
          return output.marchToMeteor!({ meteor: meteorStr, dir: marchStr });
        }
        return output.goToMeteor!({ meteor: meteorStr });
      },
      outputStrings: {
        plusTwo: {
          en: '+2 Heat Meteor',
          de: '+2 Heiß-Meteor',
          fr: 'Météore de chaleur +2',
          ja: '炎属性+2',
          cn: '火+2陨石',
          ko: '+2 불 메테오',
        },
        plusOne: {
          en: '+1 Heat Meteor',
          de: '+1 Heiß-Meteor',
          fr: 'Météore de chaleur +1',
          ja: '炎属性+1',
          cn: '火+1陨石',
          ko: '+1 불 메테오',
        },
        minusOne: {
          en: '-1 Cold Meteor',
          de: '-1 Kalt-Meteor',
          fr: 'Météore de froid -1',
          ja: '氷属性-1',
          cn: '冰-1陨石',
          ko: '-1 얼음 메테오',
        },
        minusTwo: {
          en: '-2 Cold Meteor',
          de: '-2 Kalt-Meteor',
          fr: 'Météore de froid -2',
          ja: '氷属性-2',
          cn: '冰-2陨石',
          ko: '-2 얼음 메테오',
        },
        unknownTemperature: {
          en: 'Opposite Meteor',
          de: 'Entgegengesetzer Meteor',
          fr: 'Météore de l\'élément opposé',
          ja: '体温と逆のメテオを受ける',
          cn: '去相反温度的陨石',
          ko: '반대속성 메테오',
        },
        forwards: {
          en: 'forwards',
          de: 'Vorwärts',
          fr: 'vers l\'avant',
          ja: '前',
          cn: '前',
          ko: '앞',
        },
        backwards: {
          en: 'backwards',
          de: 'Rückwärts',
          fr: 'vers l\'arrière',
          ja: '後ろ',
          cn: '后',
          ko: '뒤',
        },
        left: {
          en: 'left',
          de: 'Links',
          fr: 'à gauche',
          ja: '左',
          cn: '左',
          ko: '왼쪽',
        },
        right: {
          en: 'right',
          de: 'Rechts',
          fr: 'à droite',
          ja: '右',
          cn: '右',
          ko: '오른쪽',
        },
        goToMeteor: {
          en: 'Go to ${meteor} (watch clones)',
          de: 'Gehe zum ${meteor} (beachte die Klone)',
          fr: 'Allez au ${meteor} (regardez les clones)',
          ja: '${meteor}へ (分体を見る)',
          cn: '去${meteor}，观察分身',
          ko: '${meteor}쪽으로 (분신 위치 확인)',
        },
        marchToMeteor: {
          en: 'March ${dir} to ${meteor}',
          de: 'Marchiere ${dir} zum ${meteor}',
          fr: 'Marchez ${dir} du ${meteor}',
          ja: '強制移動: ${dir} > ${meteor}',
          cn: '强制移动：${dir} > ${meteor}',
          ko: '강제이동: ${dir} > ${meteor}',
        },
      },
    },
    {
      id: 'DelubrumSav Avowed Hot And Cold Unwavering Apparations',
      type: 'GainsEffect',
      // The buffs come out before the spell cast
      // Trinity Avowed and/or Avowed Avatar receive one of these buffs:
      // 8F9: Hot Blade: +1
      // 8FA: Hot Blade: +2
      // 8FB: Cold Blade: -1
      // 8FC: Cold Blade: -2
      // Positional data in statusEffectsParams is often not up to date, use promise
      //
      // Trigger delayed until after Blade Of Entropy happens about ~100ms after
      // to get left/right cleave info
      // Ignoring Trinity Avowed due to Environment 'randomly' refreshing its buff
      netRegex: { target: 'Avowed Avatar', effectId: ['8F9', '8FA', '8FB', '8FC'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: 9.5,
      suppressSeconds: 1,
      promise: async (data, _matches, output) => {
        const trinityLocaleNames: LocaleText = {
          en: 'Trinity Avowed',
          de: 'Trinität Der Eingeschworenen',
          fr: 'Trinité féale',
          ja: 'トリニティ・アヴァウ',
          cn: '誓约之三位一体',
          ko: '트리티니 어바우드',
        };

        const avatarLocaleNames: LocaleText = {
          en: 'Avowed Avatar',
          de: 'Spaltteil der Eingeschworenen',
          fr: 'Clone de la Trinité féale',
          ja: 'アヴァウドの分体',
          cn: '誓约之分身',
          ko: '어바우드 아바타',
        };

        // select the Trinity and Avatars
        let combatantNameBoss = null;
        let combatantNameAvatar = null;
        combatantNameBoss = trinityLocaleNames[data.parserLang];
        combatantNameAvatar = avatarLocaleNames[data.parserLang];

        let combatantDataBoss = null;
        let combatantDataAvatars = null;
        if (combatantNameBoss !== undefined) {
          combatantDataBoss = await callOverlayHandler({
            call: 'getCombatants',
            names: [combatantNameBoss],
          });
        }
        if (combatantNameAvatar !== undefined) {
          combatantDataAvatars = await callOverlayHandler({
            call: 'getCombatants',
            names: [combatantNameAvatar],
          });
        }

        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (combatantDataBoss === null) {
          console.error(`Trinity Avowed: null data`);
          delete data.safeZone;
          return;
        }
        if (combatantDataAvatars === null) {
          console.error(`Avowed Avatar: null data`);
          delete data.safeZone;
          return;
        }
        if (combatantDataAvatars.combatants.length < 3) {
          console.error(
            `Avowed Avatar: expected at least 3 combatants got ${combatantDataAvatars.combatants.length}`,
          );
          delete data.safeZone;
          return;
        }
        if (!data.blades) {
          console.error(`Avowed Avatar: missing blades`);
          delete data.safeZone;
          return;
        }

        const getFacing = (combatant: PluginCombatantState) => {
          // Snap heading to closest card.
          // N = 0, E = 1, S = 2, W = 3
          return (2 - Math.round(combatant.Heading * 4 / Math.PI) / 2) % 4;
        };

        const getUnwaveringPosition = (combatant: PluginCombatantState) => {
          // Positions are moved downward 87 and left 277
          const y = combatant.PosY + 87;
          const x = combatant.PosX + 277;
          // N = 0, E = 1, S = 2, W = 3
          return Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;
        };

        // we need to filter for the Trinity Avowed with the lowest ID
        // that one is always cleaving on one of the cardinals
        // Trinity Avowed is always East (-267, -87)
        const sortCombatants = (a: PluginCombatantState, b: PluginCombatantState) =>
          (a.ID ?? 0) - (b.ID ?? 0);
        const eastCombatant = combatantDataBoss.combatants.sort(sortCombatants).shift();

        // we need to filter for the three Avowed Avatars with the lowest IDs
        // as they cast cleave at the different cardinals
        const [avatarOne, avatarTwo, avatarThree] = combatantDataAvatars.combatants.sort(
          sortCombatants,
        );
        if (!avatarOne || !avatarTwo || !avatarThree)
          throw new UnreachableCode();

        const combatantPositions: PluginCombatantState[] = [];
        combatantPositions[getUnwaveringPosition(avatarOne)] = avatarOne;
        combatantPositions[getUnwaveringPosition(avatarTwo)] = avatarTwo;
        combatantPositions[getUnwaveringPosition(avatarThree)] = avatarThree;

        // Avowed Avatars can spawn in the other positions
        // Determine the location of Avowed Avatars
        // North Avowed Avatar (-277, -97)
        // South Avowed Avatar (-277, -77)
        // West Avowed Avatar (-277, -87)
        const [northCombatant, , southCombatant, westCombatant] = combatantPositions;
        if (!northCombatant || !southCombatant || !westCombatant)
          throw new UnreachableCode();

        // Get facings
        const northCombatantFacing = getFacing(northCombatant);
        const southCombatantFacing = getFacing(southCombatant);

        // Get Blade of Entropy data
        const eastCombatantBlade = data.blades[eastCombatant?.ID ?? 0];
        const northCombatantBlade = data.blades[northCombatant?.ID ?? 0];
        const westCombatantBlade = data.blades[westCombatant?.ID ?? 0];
        const southCombatantBlade = data.blades[southCombatant?.ID ?? 0];
        if (
          eastCombatantBlade === undefined || northCombatantBlade === undefined ||
          westCombatantBlade === undefined || southCombatantBlade === undefined
        )
          throw new UnreachableCode();

        const bladeValues: { [id: string]: number } = {
          '5942': 1,
          '5943': -1,
          '5946': 1,
          '5947': -1,
          '5956': 2,
          '5957': -2,
          '595A': 2,
          '595B': -2,
        };

        // 1 = Right
        // 0 = Left
        const bladeSides: { [id: string]: number } = {
          '5942': 1,
          '5943': 1,
          '5946': 0,
          '5947': 0,
          '5956': 1,
          '5957': 1,
          '595A': 0,
          '595B': 0,
        };

        const eastCombatantBladeValue = bladeValues[eastCombatantBlade];
        const northCombatantBladeValue = bladeValues[northCombatantBlade];
        const westCombatantBladeValue = bladeValues[westCombatantBlade];
        const southCombatantBladeValue = bladeValues[southCombatantBlade];
        if (
          eastCombatantBladeValue === undefined || northCombatantBladeValue === undefined ||
          westCombatantBladeValue === undefined || southCombatantBladeValue === undefined
        )
          throw new UnreachableCode();

        // Create map to improve readability of safeZone conditions
        const dirNum = { north: 0, east: 1, south: 2, west: 3 };

        // Only need to check cleaves from two parallel clones to determine safe spots
        // because if the clone is cleaving inside, then we know where other clones
        // are cleaving in order to make a '+' where the ends are each cleaved by one
        // clone and the middle square is safe
        let safeZone = null;
        let adjacentZones: { [dir: number]: number } = {};
        if (
          northCombatantFacing === dirNum.north && bladeSides[northCombatantBlade] ||
          northCombatantFacing === dirNum.south && !bladeSides[northCombatantBlade]
        ) {
          // North clone cleaving inside east (and therefore east clone cleaving north).
          safeZone = output.southwest!();
          adjacentZones = {
            [dirNum.north]: eastCombatantBladeValue,
            [dirNum.east]: northCombatantBladeValue,
            [dirNum.south]: southCombatantBladeValue,
            [dirNum.west]: westCombatantBladeValue,
          };
        } else if (
          northCombatantFacing === dirNum.north && !bladeSides[northCombatantBlade] ||
          northCombatantFacing === dirNum.south && bladeSides[northCombatantBlade]
        ) {
          // North clone cleaving inside west (and therefore west clone cleaving north).
          safeZone = output.southeast!();
          adjacentZones = {
            [dirNum.north]: westCombatantBladeValue,
            [dirNum.east]: eastCombatantBladeValue,
            [dirNum.south]: southCombatantBladeValue,
            [dirNum.west]: northCombatantBladeValue,
          };
        } else if (
          southCombatantFacing === dirNum.south && bladeSides[southCombatantBlade] ||
          southCombatantFacing === dirNum.north && !bladeSides[southCombatantBlade]
        ) {
          // South clone cleaving inside west (and therefore west clone cleaving south).
          safeZone = output.northeast!();
          adjacentZones = {
            [dirNum.north]: northCombatantBladeValue,
            [dirNum.east]: eastCombatantBladeValue,
            [dirNum.south]: westCombatantBladeValue,
            [dirNum.west]: southCombatantBladeValue,
          };
        } else if (
          southCombatantFacing === dirNum.north && bladeSides[southCombatantBlade] ||
          southCombatantFacing === dirNum.south && !bladeSides[southCombatantBlade]
        ) {
          // South clone cleaving inside east (and therefore east clone cleaving south).
          safeZone = output.northwest!();
          adjacentZones = {
            [dirNum.north]: northCombatantBladeValue,
            [dirNum.east]: southCombatantBladeValue,
            [dirNum.south]: eastCombatantBladeValue,
            [dirNum.west]: westCombatantBladeValue,
          };
        } else {
          // facing did not evaluate properly
          console.error(
            `Avowed Avatar: facing error, ` +
              `${northCombatantFacing}, ${southCombatantFacing}, ` +
              `${JSON.stringify(bladeSides[northCombatantBlade])}, ` +
              `${JSON.stringify(bladeSides[southCombatantBlade])}`,
          );
          data.safeZone = output.unknown!();
          return;
        }

        const currentBrand = data.currentBrand ? data.currentBrand : 0;
        const currentTemperature = data.currentTemperature ? data.currentTemperature : 0;
        const effectiveTemperature = currentTemperature + currentBrand;

        // Calculate which adjacent zone to go to, if needed
        let adjacentZone: string | null | undefined = null;
        if (effectiveTemperature !== 0) {
          // Find the adjacent zone that gets closest to 0
          const calculatedZones = Object.values(adjacentZones).map((i: number) =>
            Math.abs(effectiveTemperature + i)
          );

          // Use zone closest to zero as output
          const dirs = {
            [dirNum.north]: output.north!(),
            [dirNum.east]: output.east!(),
            [dirNum.south]: output.south!(),
            [dirNum.west]: output.west!(),
          };
          const zoneClosestToZero = [...calculatedZones].sort((a, b) => b - a).pop();
          if (zoneClosestToZero === undefined)
            throw new UnreachableCode();
          adjacentZone = dirs[calculatedZones.indexOf(zoneClosestToZero)];
          if (adjacentZone === undefined)
            throw new UnreachableCode();
        }

        // Callout safe spot and get cleaved spot if both are known
        // Callout safe spot only if no need to be cleaved
        if (adjacentZone !== null) {
          data.safeZone = output.getCleaved!({ dir1: safeZone, dir2: adjacentZone });
        } else if (safeZone) {
          data.safeZone = output.safeSpot!({ dir: safeZone });
        } else {
          console.error(`Avowed Avatar: undefined zones`);
          data.safeZone = output.unknown!();
        }
      },
      alertText: (data, _matches, output) => data.safeZone ?? output.unknown!(),
      outputStrings: {
        getCleaved: {
          en: '${dir1} Safe Spot => ${dir2} for cleave',
          de: 'Sichere Stelle ${dir1} => ${dir2} für Cleave',
          fr: '${dir1} Zone safe => ${dir2} pour le cleave',
          ja: '${dir1}に安置 => ${dir2}範囲攻撃に',
          cn: '去${dir1}方安全点 => 去${dir2}吃顺劈',
          ko: '${dir1} 안전한 곳 🔜 ${dir2} 클레브 맞아요',
        },
        safeSpot: {
          en: '${dir} Safe Spot',
          de: 'Sichere Stelle ${dir}',
          fr: '${dir} Zone safe',
          ja: '${dir}に安置',
          cn: '去${dir}方安全点',
          ko: '${dir} 안전한 곳',
        },
        unknown: Outputs.unknown,
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
      },
    },
    {
      id: 'DelubrumSav Avowed Gleaming Arrow Collect',
      type: 'StartsUsing',
      netRegex: { source: 'Avowed Avatar', id: '594D' },
      run: (data, matches) => {
        data.unseenIds ??= [];
        data.unseenIds.push(parseInt(matches.sourceId, 16));
      },
    },
    {
      id: 'DelubrumSav Avowed Gleaming Arrow',
      type: 'StartsUsing',
      netRegex: { source: 'Avowed Avatar', id: '594D', capture: false },
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

        const rows = data.unseenBadRows;
        const cols = data.unseenBadCols;
        if (!rows || !cols)
          return;

        if (data.avowedPhase === 'bow') {
          // consider asserting that badCols are 0, 2, 4 here.
          if (rows.includes(2))
            return output.bowLight!();
          return output.bowDark!();
        }

        if (data.avowedPhase !== 'staff')
          return;

        if (cols.includes(1)) {
          if (rows.includes(1))
            return output.staffOutsideCorner!();
          return output.staffOutsideColInsideRow!();
        }
        if (cols.includes(0)) {
          if (rows.includes(0))
            return output.staffInsideCorner!();
          return output.staffInsideColOutsideRow!();
        }
      },
      outputStrings: {
        bowDark: {
          en: 'Dark (E/W of center)',
          de: 'Dunkel (O/W von der Mitte)',
          fr: 'Foncée (E/O du centre)',
          ja: 'ダーク床 (東/西)',
          cn: '内圈东西(左右)暗色地板',
          ko: '어두운 타일 (한가운데서 좌우)',
        },
        bowLight: {
          en: 'Light (diagonal from center)',
          de: 'Licht (Diagonal von der Mitte)',
          fr: 'Claire (diagonale du centre)',
          ja: 'ライト床 (中の対角)',
          cn: '内圈四角亮色地板',
          ko: '밝은 타일 (한가운데서 대각)',
        },
        staffOutsideCorner: {
          en: 'Outside Corner',
          de: 'Äußere Ecken',
          fr: 'Coin extérieur',
          ja: '外のコーナー',
          cn: '外圈四角亮色地板',
          ko: '맵 구석의 밝은 타일',
        },
        staffInsideCorner: {
          en: 'Inside Corner',
          de: 'Innere Ecken',
          fr: 'Coin intérieur',
          ja: '中のコーナー',
          cn: '内圈四角亮色地板',
          ko: '구석에서 한칸 안쪽 밝은 타일',
        },
        staffOutsideColInsideRow: {
          en: 'N/S of Corner',
          de: 'N/S von der Ecke',
          fr: 'N/S du coin',
          ja: '南北行のダーク床',
          cn: '外圈南北(上下)暗色地板',
          ko: '구석에서 남북 어두운 타일',
        },
        staffInsideColOutsideRow: {
          en: 'E/W of Corner',
          de: 'O/W von der Ecke',
          fr: 'E/O du coin',
          ja: '東西列のダーク床',
          cn: '外圈东西(左右)暗色地板',
          ko: '구석에서 좌우 어두운 타일',
        },
      },
    },
    {
      id: 'DelubrumSav Lord Foe Splitter',
      type: 'StartsUsing',
      netRegex: { source: 'Stygimoloch Lord', id: '57D7' },
      // THANKFULLY this starts using comes out immediately before the headmarker line.
      preRun: (data) => data.firstUnknownHeadmarker = headmarker.foeSplitter,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleaveOnYou: Outputs.tankCleaveOnYou,
          cleaveNoTarget: Outputs.tankCleave,
          avoidCleave: Outputs.avoidTankCleave,
          cleaveOn: {
            en: 'Tank Cleave on ${player}',
            de: 'Tank Cleave auf ${player}',
            fr: 'Tank Cleave sur ${player}',
            ja: '${player}に範囲攻撃',
            cn: '顺劈: ${player}',
            ko: '${player}에게 탱크클레브',
          },
        };
        if (matches.target === data.me)
          return { alarmText: output.cleaveOnYou!() };
        if (tankBusterOnParty(data, matches))
          return { alertText: output.cleaveOn!({ player: data.party.member(matches.target) }) };
        return { infoText: output.avoidCleave!() };
      },
    },
    {
      id: 'DelubrumSav Lord Rapid Bolts',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return false;
        return getHeadmarkerId(data, matches) === headmarker.thunder;
      },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Drop thunder outside',
          de: 'Lege Blitz draußen ab',
          fr: 'Déposez la foudre à l\'extérieur',
          ja: '外に捨てる',
          cn: '外圈放雷',
          ko: '바깥에 번개장판 버려요',
        },
      },
    },
    {
      id: 'DelubrumSav Lord Labyrinthine Fate Collect',
      type: 'GainsEffect',
      // 97E: Wanderer's Fate, Pushes outward on Fateful Word cast
      // 97F: Sacrifice's Fate, Pulls to middle on Fateful Word cast
      netRegex: { effectId: '97[EF]' },
      condition: Conditions.targetIsYou(),
      preRun: (data, matches) => {
        data.labyrinthineFate = matches.effectId.toUpperCase();
      },
      // This effect is given repeatedly.
      suppressSeconds: 30,
      infoText: (data, _matches, output) => {
        // The first time this happens, there is ~2.5 seconds between debuff application
        // and the start of the cast to execute that debuff.  Be less noisy on the first.
        if (!data.seenLabyrinthineFate)
          return;

        if (data.labyrinthineFate === '97F')
          return output.getOutLater!();
        if (data.labyrinthineFate === '97E')
          return output.getInLater!();
      },
      run: (data) => data.seenLabyrinthineFate = true,
      outputStrings: {
        getOutLater: {
          en: '(sacrifice out, for later)',
          de: '(Heranziehen raus, für später)',
          fr: '(sacrifice à l\'extérieur, pour plus tard)',
          ja: '(外の切れ目に引き付ける)',
          cn: '(外缺口等待吸引)',
          ko: '(저주의 말 시전하면 바깥쪽으로)',
        },
        getInLater: {
          en: '(wanderer in, for later)',
          de: '(Zurückschleudern rein, für später)',
          fr: '(errant à l\'intérieur, pour plus tard)',
          ja: '(中の切れ目に吹き飛ばす)',
          cn: '(内缺口等待击退)',
          ko: '(저주의 말 시전하면 안쪽으로)',
        },
      },
    },
    {
      id: 'DelubrumSav Lord Fateful Words',
      type: 'StartsUsing',
      netRegex: { source: 'Stygimoloch Lord', id: '57C9', capture: false },
      // 97E: Wanderer's Fate, Pushes outward on Fateful Word cast
      // 97F: Sacrifice's Fate, Pulls to middle on Fateful Word cast
      // Labyrinthine Fate is cast and 1 second later debuffs are applied
      // First set of debuffs go out 7.7 seconds before Fateful Word is cast
      // Remaining set of debuffs go out 24.3 seconds before Fateful Word is cast
      alertText: (data, _matches, output) => {
        if (data.labyrinthineFate === '97F')
          return output.getOut!();
        if (data.labyrinthineFate === '97E')
          return output.getIn!();
      },
      // In case you die and don't get next debuff, clean this up so it doesn't call again.
      run: (data) => delete data.labyrinthineFate,
      outputStrings: {
        getOut: Outputs.out,
        getIn: Outputs.in,
      },
    },
    {
      id: 'DelubrumSav Lord Devastating Bolt',
      type: 'StartsUsing',
      netRegex: { source: 'Stygimoloch Lord', id: '57C5', capture: false },
      durationSeconds: 4,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get In Nook',
          de: 'Geh in die Ecke',
          fr: 'Allez dans un recoin',
          ja: '切れ目に入る',
          cn: '进入缺口',
          ko: '틈새로 들어가요',
        },
      },
    },
    {
      id: 'DelubrumSav Lord 1111-Tonze Swing',
      type: 'StartsUsing',
      netRegex: { source: 'Stygimoloch Lord', id: '57D8', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'DelubrumSav Queen Cleansing Slash',
      type: 'StartsUsing',
      // PLD and GNB tank invulnerabilities do not get Physical Vulnerability Up
      // Tank swap will be required between the two hits if not using a tank invulnerability
      // Tank swap required after second hit if not using PLD or GNB tank invulnerabilities
      // To avoid bad swaps between 11 other tanks, only mention swap to targetted tank
      netRegex: { source: 'The Queen', id: '59F5' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankBusterAndSwap: {
            en: 'Tank Buster + Swap',
            de: 'Tankbuster + Wechsel',
            fr: 'Tank buster + Swap',
            ja: 'タンクバスター + スイッチ',
            cn: '死刑 + 换T',
            ko: '탱크버스터 + 교대',
          },
          tankBusterOnYou: Outputs.tankBusterOnYou,
          tankBusterOnPlayer: Outputs.tankBusterOnPlayer,
          tankInvuln: {
            en: 'Invuln Tank Buster',
            de: 'Unverwundbarkeit für Tank Buster benutzen',
            fr: 'Invincible sur le Tank buster',
            ja: 'タンクバスター (被ダメージ上昇付き)',
            cn: '易伤死刑',
            ko: '무적으로 탱크버스터 맞아요',
          },
        };

        if (data.me === matches.target) {
          if (data.role === 'tank') {
            if (data.job === 'PLD' || data.job === 'GNB')
              return { alertText: output.tankInvuln!() };
            return { alertText: output.tankBusterAndSwap!() };
          }
          return { alarmText: output.tankBusterOnYou!() };
        }
        const sev = data.role === 'healer' || data.role === 'tank' ? 'alertText' : 'infoText';
        return { [sev]: output.tankBusterOnPlayer!({ player: matches.target }) };
      },
    },
    {
      id: 'DelubrumSav Queen Cleansing Slash Doom',
      type: 'GainsEffect',
      // Each Cleansing Slash applies a cleansable Doom (38E), if damage is taken
      netRegex: { source: 'The Queen', effectId: '38E' },
      condition: (data) => data.CanCleanse(),
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.target) }),
      outputStrings: {
        text: {
          en: 'Esuna ${player}',
          de: 'Medica ${player}',
          fr: 'Guérison sur ${player}',
          ja: '${player} にエスナ',
          cn: '驱散: ${player}',
          ko: '에스나: ${player}',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Dispel',
      type: 'GainsEffect',
      // Players with Dispel should Dispel all the buffs on The Queen.
      // Critical Strikes = 705 is the first one.
      netRegex: { target: 'The Queen', effectId: '705', capture: false },
      condition: (data) => {
        data.queenDispelCount = (data.queenDispelCount || 0) + 1;
        // The third time she gains this effect is the enrage, and there's no need to dispel.
        return data.queenDispelCount <= 2;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dispel Queen',
          de: 'Kriegsgöttin reinigen',
          fr: 'Dissipez la Reine',
          ja: 'ボスにディスペル',
          cn: '驱魔 > 女王',
          ko: '보스 디스펠',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Ball Lightning',
      type: 'AddedCombatant',
      // Players with Reflect should destroy one for party to stand in the shield left behind
      netRegex: { npcNameId: '7974', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Reflect Orbs',
          de: 'Reflektiere Orbs',
          fr: 'Reflétez les orbes',
          ja: '雷玉にリフレク',
          cn: '反射雷球',
          ko: '구슬에 리플렉트',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Ball Lightning Bubble',
      type: 'WasDefeated',
      netRegex: { target: 'Ball Lightning', capture: false },
      suppressSeconds: 20,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get in Bubble',
          de: 'Geh in die Blase',
          fr: 'Allez dans la bulle',
          ja: '泡に入る',
          cn: '进泡泡',
          ko: '버블 안으로',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Fiery Portent',
      type: 'StartsUsing',
      netRegex: { source: 'Queen\'s Soldier', id: '5A21' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      durationSeconds: 5.5,
      response: Responses.stopEverything(),
    },
    {
      id: 'DelubrumSav Queen Icy Portent',
      type: 'StartsUsing',
      // Assuming you need to move for 3 seconds (duration of Pyretic from Fiery Portent)
      netRegex: { source: 'Queen\'s Soldier', id: '5A22' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      durationSeconds: 5.5,
      response: Responses.moveAround('alert'),
    },
    {
      id: 'DelubrumSav Queen Judgment Blade Right',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59F2', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Find Charge, Dodge Right',
          de: 'Halte nach dem Ansturm ausschau, weiche nach rechts aus',
          fr: 'Repérez la charge, esquivez à droite',
          ja: '右へ、突進を避ける',
          cn: '去右侧躲避冲锋',
          ko: '돌진 찾고, 오른쪽 피해요',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Judgment Blade Left',
      type: 'StartsUsing',
      netRegex: { source: 'The Queen', id: '59F1', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Find Charge, Dodge Left',
          de: 'Halte nach dem Ansturm ausschau, weiche nach links aus',
          fr: 'Repérez la charge, esquivez à gauche',
          ja: '左へ、突進を避ける',
          cn: '去左侧躲避冲锋',
          ko: '돌진 찾고, 왼쪽 피해요',
        },
      },
    },
    {
      id: 'DelubrumSav Queen Guard AoEs',
      type: 'StartsUsing',
      // 5A16 from Queen's Warrior
      // 5A08 from Queen's Knight
      // 5A35 from Queen's Gunner
      // 5A23 from Queen's Soldier
      // These happen in sets:
      // Set 1 Double AoE, 3 seconds later Double AoE
      // Set 2 5 seconds later, Double AoE, 3 seconds later Double AoE, 3 seconds later AoE + Bleed
      // Set 3 1.3 seconds later, Single AoEs every 3 seconds all while bleed from set 2 persists
      netRegex: {
        source: ['Queen\'s Warrior', 'Queen\'s Knight', 'Queen\'s Gunner', 'Queen\'s Soldier'],
        id: ['5A16', '5A08', '5A35', '5A23'],
        capture: false,
      },
      // Only call out the beginning of a set of two casts
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Multiple AOEs',
          de: 'Mehrere AoEs',
          fr: 'Multiple AoEs',
          ja: '連続AoE',
          cn: '连续AoE',
          ko: '연속 전체 공격',
        },
      },
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
        'Flashvane/Fury Of Bozja/Infernal Slash': 'Random Arsenal',
        'Icy Portent/Fiery Portent': 'Icy/Fiery Portent',
        'Fiery Portent/Icy Portent': 'Fiery/Icy Portent',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        '(?<!Crowned )Marchosias': 'Marchosias',
        'Aetherial Bolt': 'Magiegeschoss',
        'Aetherial Burst': 'Magiebombe',
        'Aetherial Orb': 'Magiekugel',
        'Aetherial Sphere': 'Ätherwind',
        'Aetherial Ward': 'Barriere',
        'Automatic Turret': 'Selbstschuss-Gyrocopter',
        'Avowed Avatar': 'Spaltteil der Eingeschworenen',
        'Ball Lightning': 'Elektrosphäre',
        'Ball Of Fire': 'Feuerball',
        'Bicolor Golem': 'zweifarbig(?:e|er|es|en) Golem',
        'Bozjan Phantom': 'Bozja-Phantom',
        'Bozjan Soldier': 'Bozja-Soldat',
        'Crowned Marchosias': 'Marchosias-Leittier',
        'Dahu': 'Dahu',
        'Dahu was defeated by': 'hat Dahu besiegt',
        'Grim Reaper': 'Grausamer Schlitzer',
        'Gun Turret': 'Geschützturm',
        'Immolating Flame': 'Flammensturm',
        'Pride of the Lion(?!ess)': 'Saal des Löwen',
        'Pride of the Lioness': 'Segen der Löwin',
        'Queen\'s Gunner': 'Schütze der Königin',
        'Queen\'s Knight': 'Ritter der Königin',
        'Queen\'s Soldier': 'Soldat der Königin',
        'Queen\'s Warrior': 'Kriegerin der Königin',
        'Queensheart': 'Saal der Dienerinnen',
        'Ruins Golem': 'Ruinengolem',
        'Sanguine Clot': 'schauerlich(?:e|er|es|en) Blutgerinsel',
        'Seeker Avatar': 'Spaltteil der Sucher',
        'Soldier Avatar': 'Spaltteil des Soldaten',
        'Spark Arrow': 'Feuerpfeil',
        'Spiritual Sphere': 'Seelenwind',
        'Stuffy Wraith': 'muffig(?:e|er|es|en) Schrecken',
        'Stygimoloch Lord': 'Anführer-Stygimoloch',
        'Stygimoloch Monk': 'Stygimoloch',
        'Stygimoloch Warrior': 'Krieger-Stygimoloch',
        'Tempestuous Orb': 'groß(?:e|er|es|en) Eisball',
        'The Hall of Hieromancy': 'Halle des Orakels',
        'The Hall of Supplication': 'Große Gebetshalle',
        'The Path of Divine Clarity': 'Sanktuarium des Lebens',
        'The Queen': 'Kriegsgöttin',
        'The Theater of One': 'Einsame Arena',
        'The Vault of Singing Crystal': 'Ort des Klingenden Kristalls',
        'Trinity Avowed': 'Trinität der Eingeschworenen',
        'Trinity Seeker': 'Trinität der Sucher',
        'Viscous Clot': 'zäh(?:e|er|es|en) Blutgerinsel',
        'Why\\.\\.\\.won\'t\\.\\.\\.you\\.\\.\\.': 'Neiiin! Wie ist das möglich',
      },
      'replaceText': {
        '(?<!C)Rush': 'Stürmen',
        '(?<!Inescapable )Entrapment': 'Fallenlegen',
        '--Spite Check--': '--Meditation Check--',
        '--adds--': '--Adds--',
        '--bleed--': '--Blutung--',
        '--chains--': '--Ketten--',
        '--stunned--': '--betäubt--',
        '--tethers--': '--Verbindungen--',
        '--unstunned--': '--nicht länger betäubt--',
        '1111-Tonze Swing': '1111-Tonzen-Schwung',
        'Above Board': 'Über dem Feld',
        'Act Of Mercy': 'Schneller Stich des Dolches',
        'Allegiant Arsenal': 'Waffenwechsel',
        'Aura Sphere': 'Kampfwind',
        'Automatic Turret': 'Selbstschuss-Gyrocopter',
        'Baleful Blade': 'Stoß der Edelklinge',
        'Baleful Comet': 'Flammenstapel der Edelklinge',
        'Baleful Firestorm': 'Ätherflamme der Edelklinge',
        'Baleful Onslaught': 'Wilder Schlitzer der Edelklinge',
        'Baleful Swathe': 'Schwarzer Wirbel der Edelklinge',
        'Beck And Call To Arms': 'Feuerbefehl',
        'Blade Of Entropy': 'Eisflammenklinge',
        'Blood And Bone': 'Wellenschlag',
        'Bloody Wraith': 'blutrünstiger Schrecken',
        'Bombslinger': 'Bombenabwurf',
        'Boost': 'Kräfte sammeln',
        'Bozjan Soldier': 'Bozja-Soldat',
        'Burn': 'Verbrennung',
        'Cleansing Slash': 'Säubernder Schnitt',
        'Coat Of Arms': 'Trotz',
        'Coerce': 'Zwang',
        'Core Combustion': 'Brennender Kern',
        'Crazed Rampage': 'Gereizter Wutlauf',
        'Creeping Miasma': 'Miasmahauch',
        'Crushing Hoof': 'Tödlicher Druck',
        'Dead Iron': 'Woge der Feuerfaust',
        'Death Scythe': 'Todessichel',
        'Devastating Bolt': 'Heftiger Donner',
        'Devour': 'Verschlingen',
        'Double Gambit': 'Illusionsmagie',
        'Elemental Arrow': 'Element-Pfeil',
        'Elemental Blast': 'Element-Explosion',
        'Elemental Brand': 'Eisflammenfluch',
        'Elemental Impact': 'Einschlag',
        'Empyrean Iniquity': 'Empyreische Interdiktion',
        'Excruciation': 'Fürchterlicher Schmerz',
        'Falling Rock': 'Steinschlag',
        'Fateful Words': 'Worte des Verderbens',
        'Feral Howl': 'Wildes Heulen',
        'Fiery Portent': 'Fieberhitze',
        'Firebreathe': 'Lava-Atem',
        'First Mercy': '1. Streich: Viererdolch-Haltung',
        'Flailing Strike': 'Wirbelnder Schlag',
        'Flames Of Bozja': 'Bozianische Flamme',
        'Flashvane': 'Schockpfeile',
        'Focused Tremor': 'Kontrolliertes Beben',
        'Foe Splitter': 'Tobender Teiler',
        'Fool\'s Gambit': 'Bezauberungsmagie',
        'Forceful Strike': 'Kraftvoller Schlag',
        'Fourth Mercy': '4. Streich: Viererdolch-Haltung',
        'Fracture': 'Sprengung',
        'Freedom Of Bozja': 'Bozianische Freiheit',
        'Fury Of Bozja': 'Bozianische Wut',
        'Gleaming Arrow': 'Funkelnder Pfeil',
        'Glory Of Bozja': 'Stolz von Bozja',
        'Gods Save The Queen': 'Wächtergott der Königin',
        'Great Ball Of Fire': 'Feuerball',
        'Gun Turret': 'Geschützturm',
        'Gunnhildr\'s Blades': 'Gunnhildrs Schwert',
        'Head Down': 'Scharrende Hufe',
        'Heaven\'s Wrath': 'Heilige Perforation',
        'Higher Power': 'Elektrische Ladung',
        'Hot And Cold': 'Heiß und kalt',
        'Hot Charge': 'Heiße Rage',
        'Hunter\'s Claw': 'Jägerklaue',
        'Hysteric Assault': 'Hysterischer Ansturm',
        'Ice Spikes': 'Eisstachel',
        'Icy Portent': 'Frostwinde',
        'Inescapable Entrapment': 'Extrem-Fallenlegen',
        'Infernal Slash': 'Yama-Schnitt',
        'Invert Miasma': 'Umgekehrte Miasmakontrolle',
        'Iron Impact': 'Kanon der Feuerfaust',
        'Iron Rose': 'Rose des Hasses der Feuerfaust',
        'Iron Splitter': 'Furor der Feuerfaust',
        'Judgment Blade': 'Klinge des Urteils',
        'Labyrinthine Fate': 'Fluch des Herren des Labyrinths',
        'Leaping Spark': 'Endloser Donner',
        'Left-Sided Shockwave': 'Linke Schockwelle',
        'Lethal Blow': 'Verheerender Schlag',
        'Lingering Miasma': 'Miasmawolke',
        'Lots Cast': 'Magieexplosion',
        'Maelstrom\'s Bolt': 'Heiligenlichter',
        'Malediction of Agony': 'Pochender Fluch',
        'Malediction of Ruin': 'Fluch des Verfalls',
        'Mana Flame': 'Manaflamme',
        'Manifest Avatar': 'Teilung des Selbsts',
        'Manipulate Miasma': 'Miasmakontrolle',
        'Memory of the Labyrinth': 'Edikt des Herren des Labyrinths',
        'Merciful Arc': 'Fächertanz des Dolches',
        'Merciful Blooms': 'Kasha des Dolches',
        'Merciful Breeze': 'Yukikaze des Dolches',
        'Merciful Moon': 'Gekko des Dolches',
        'Mercy Fourfold': 'Viererdolch',
        'Metamorphose': 'Materiewandel',
        'Misty Wraith': 'flüchtiger Schrecken',
        'Northswain\'s Glow': 'Stella Polaris',
        'Optimal Offensive': 'Beste Attacke',
        'Optimal Play': 'Bestes Manöver',
        'Pawn Off': 'Kranzklinge',
        'Phantom Edge': 'Phantomklingen',
        'Queen\'s Edict': 'Hohes Edikt der Königin',
        'Queen\'s Justice': 'Hoheitliche Strafe',
        'Queen\'s Shot': 'Omnidirektionalschuss',
        'Queen\'s Will': 'Edikt der Königin',
        'Quick March': 'Marschbefehl',
        'Rapid Bolts': 'Kettenblitz',
        'Rapid Sever': 'Radikale Abtrennung',
        'Reading': 'Demontage',
        'Relentless Battery': 'Koordiniertes Manöver',
        'Relentless Play': 'Koordinierter Angriff',
        'Rending Bolt': 'Fallender Donner',
        'Reverberating Roar': 'Einsturzgefahr',
        'Reversal Of Forces': 'Materieinversion',
        'Right-Sided Shockwave': 'Rechte Schockwelle',
        'Ruins Golem': 'Ruinengolem',
        'Sanguine Clot': 'schauerliches Blutgerinsel',
        'Seasons Of Mercy': 'Setsugekka des Dolches',
        'Second Mercy': '2. Streich: Viererdolch-Haltung',
        'Secrets Revealed': 'Enthüllte Geheimnisse',
        'Shield Omen': 'Schildhaltung',
        'Shimmering Shot': 'Glitzerpfeil',
        'Shot In The Dark': 'Einhändiger Schuss',
        'Sniper Shot': 'Fangschuss',
        'Spiritual Sphere': 'Seelenwind',
        'Spit Flame': 'Flammenspucke',
        'Spiteful Spirit': 'Meditation',
        'Strongpoint Defense': 'Absolutschild',
        'Summon Adds': 'Add-Beschwörung',
        'Summon(?! Adds)': 'Beschwörung',
        'Sun\'s Ire': 'Flammenschlag',
        'Surge of Vigor': 'Eifer',
        'Surging Flames': 'Feuerangriff',
        'Surging Flood': 'Wasserangriff',
        'Swirling Miasma': 'Miasmawirbel',
        'Sword Omen': 'Schwerthaltung',
        'The Ends': 'Kreuzschnitt',
        'The Means': 'Kreuzschlag',
        'Third Mercy': '3. Streich: Viererdolch-Haltung',
        'Thunderous Discharge': 'Blitznetz',
        'Turret\'s Tour': 'Querschlägerhagel',
        'Undying Hatred': 'Über-Psychokinese',
        'Unlucky Lot': 'Magiebombe',
        'Unrelenting Charge': 'Ungestümer Ansturm',
        'Unseen Eye': 'Geist des Blütensturms',
        'Unwavering Apparition': 'Geist des Schlächters',
        'Verdant Path': 'Lehren des Grünen Pfades',
        'Verdant Tempest': 'Zauberwind des Grünen Pfades',
        'Vicious Swipe': 'Frenetischer Feger',
        'Vile Wave': 'Welle der Boshaftigkeit',
        'Viscous Clot': 'zähes Blutgerinsel',
        'Weave Miasma': 'Miasmathese',
        'Weight Of Fortune': 'Erdrückende Kraft',
        'Whack': 'Wildes Schlagen',
        'Winds Of Fate': 'Sturm der Gewalt',
        'Winds Of Weight': 'Erdrückender Sturm',
        'Withering Curse': 'Wichtelfluch',
        'Wrath Of Bozja': 'Bozianischer Zorn',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '(?<!Crowned )Marchosias': 'marchosias',
        'Aetherial Bolt': 'petite bombe',
        'Aetherial Burst': 'énorme bombe',
        'Aetherial Orb': 'amas d\'éther élémentaire',
        'Aetherial Sphere': 'sphère d\'éther',
        'Aetherial Ward': 'Barrière magique',
        'Automatic Turret': 'Auto-tourelle',
        'Avowed Avatar': 'clone de la trinité féale',
        'Ball Lightning': 'Orbe de Foudre',
        'Ball Of Fire': 'Boule de flammes',
        'Bicolor Golem': 'golem bicolore',
        'Bozjan Phantom': 'fantôme bozjien',
        'Bozjan Soldier': 'soldat bozjien',
        'Crowned Marchosias': 'marchosias alpha',
        'Dahu': 'dahu',
        'Grim Reaper': 'Couperet funeste',
        'Gun Turret': 'Tourelle dirigée',
        'Immolating Flame': 'grande boule de feu tourbillonnante',
        'Pride of the Lion(?!ess)': 'Hall du Lion',
        'Pride of the Lioness': 'Bénédiction de la Lionne',
        'Queen\'s Gunner': 'fusilier de la reine',
        'Queen\'s Knight': 'chevalier de la reine',
        'Queen\'s Soldier': 'soldat de la reine',
        'Queen\'s Warrior': 'guerrière de la reine',
        'Queensheart': 'Chambre des prêtresses',
        'Ruins Golem': 'golem des ruines',
        'Sanguine Clot': 'caillot terrifiant',
        'Seeker Avatar': 'clone de la trinité soudée',
        'Soldier Avatar': 'double de soldat',
        'Spark Arrow': 'volée de flèches de feu',
        'Spiritual Sphere': 'sphère immatérielle',
        'Stuffy Wraith': 'spectre boursouflé',
        'Stygimoloch Lord': 'seigneur stygimoloch',
        'Stygimoloch Monk': 'stygimoloch',
        'Stygimoloch Warrior': 'guerrier stygimoloch',
        'Tempestuous Orb': 'grande boule de glace',
        'The Hall of Hieromancy': 'Salle des oracles',
        'The Hall of Supplication': 'Grande salle des prières',
        'The Path of Divine Clarity': 'Salle des sages',
        'The Queen': 'Garde-la-Reine',
        'The Theater of One': 'Amphithéâtre en ruines',
        'The Vault of Singing Crystal': 'Chambre des cristaux chantants',
        'Trinity Avowed': 'trinité féale',
        'Trinity Seeker': 'trinité soudée',
        'Viscous Clot': 'caillot visqueux',
        'Why\\.\\.\\.won\'t\\.\\.\\.you\\.\\.\\.': 'Grrroooargh.... Cette humaine... est forte...',
      },
      'replaceText': {
        '\\?': ' ?',
        '--Spite Check--': '--Vague de brutalité--',
        '--adds--': '--adds--',
        '--bleed--': '--saignement--',
        '--chains--': '--chaînes--',
        '--stunned--': '--étourdi(e)--',
        '--tethers--': '--liens--',
        '--unstunned--': '--non étourdi(e)--',
        '(?<!C)Rush': 'Ruée',
        '(?<!Inescapable )Entrapment': 'Pose de pièges',
        '1111-Tonze Swing': 'Swing de 1111 tonz',
        'Above Board': 'Aire de flottement',
        'Act Of Mercy': 'Fendreciel rédempteur',
        'Allegiant Arsenal': 'Changement d\'arme',
        'Aura Sphere': 'sphère de brutalité',
        'Automatic Turret': 'Auto-tourelle',
        'Baleful Blade': 'Assaut singulier',
        'Baleful Comet': 'Choc des flammes singulier',
        'Baleful Firestorm': 'Ruée de flammes singulière',
        'Baleful Onslaught': 'Fendoir singulier',
        'Baleful Swathe': 'Flux de noirceur singulier',
        'Beck And Call To Arms': 'Ordre d\'attaquer',
        'Blade Of Entropy': 'Sabre du feu et de la glace',
        'Blood And Bone': 'Onde tranchante',
        'Bloody Wraith': 'spectre sanglant',
        'Bombslinger': 'Jet de bombe',
        'Boost': 'Renforcement',
        'Bozjan Soldier': 'soldat bozjien',
        'Burn': 'Combustion',
        'Cleansing Slash': 'Taillade purifiante',
        'Coat Of Arms': 'Bouclier directionnel',
        'Coerce': 'Ordre irrefusable',
        'Core Combustion': 'Noyau brûlant',
        'Crazed Rampage': 'Tranchage final',
        'Creeping Miasma': 'Coulée miasmatique',
        'Crushing Hoof': 'Saut pesant',
        'Dead Iron': 'Vague des poings de feu',
        'Death Scythe': 'Faux de la mort',
        'Devastating Bolt': 'Cercle de foudre',
        'Devour': 'Dévoration',
        'Double Gambit': 'Manipulation des ombres',
        'Elemental Arrow': 'Flèche élémentaire',
        'Elemental Blast': 'Explosion élémentaire',
        'Elemental Brand': 'Malédiction du feu et de la glace',
        'Elemental Impact': 'Impact',
        'Empyrean Iniquity': 'Injustice empyréenne',
        'Excruciation': 'Atroce douleur',
        'Falling Rock': 'Chute de pierre',
        'Fateful Words': 'Mots de calamité',
        'Feral Howl': 'Rugissement sauvage',
        'Fiery Portent/Icy Portent': 'Rideau de flammes/givre',
        'Firebreathe': 'Souffle de lave',
        'First Mercy': 'Première lame rédemptrice',
        'Flailing Strike': 'Hachage rotatif',
        'Flames Of Bozja': 'Flammes de Bozja',
        'Flashvane(?!/)': 'Flèches fulgurantes',
        'Flashvane/Fury Of Bozja/Infernal Slash': 'Arsenal aléatoire',
        'Focused Tremor': 'Séisme localisé',
        'Foe Splitter': 'Fendoir horizontal',
        'Fool\'s Gambit': 'Manipulation des sens',
        'Forceful Strike': 'Hachage surpuissant',
        'Fourth Mercy': 'Quatrième lame rédemptrice',
        'Fracture': 'Fracture',
        'Freedom Of Bozja': 'Liberté de Bozja',
        '(?<!/)Fury Of Bozja(?!/)': 'Furie de Bozja',
        'Gleaming Arrow': 'Flèche miroitante',
        'Glory Of Bozja': 'Gloire de Bozja',
        'Gods Save The Queen': 'Que les Dieux gardent la Reine',
        'Great Ball Of Fire': 'Boule de feu tourbillonante',
        'Gun Turret': 'Tourelle dirigée',
        'Gunnhildr\'s Blades': 'Lame de Gunnhildr',
        'Head Down': 'Charge bestiale',
        'Heaven\'s Wrath': 'Ire céleste',
        'Higher Power': 'Charge électrique',
        'Hot And Cold': 'Chaud et froid',
        'Hot Charge': 'Charge brûlante',
        'Hunter\'s Claw': 'Griffes prédatrices',
        'Hysteric Assault': 'Assaut forcené',
        'Ice Spikes': 'Pointes de glace',
        'Icy Portent/Fiery Portent': 'Rideau de givre/flammes',
        'Inescapable Entrapment': 'Parterre de pièges',
        '(?<!/)Infernal Slash': 'Taillade de Yama',
        'Invert Miasma': 'Contrôle des miasmes inversé',
        'Iron Impact': 'Canon d\'ardeur des poings de feu',
        'Iron Rose': 'Canon de pugnacité des poings de feu',
        'Iron Splitter': 'Fracas des poings de feu',
        'Judgment Blade': 'Lame du jugement',
        'Labyrinthine Fate': 'Malédiction du seigneur du dédale',
        'Leaping Spark': 'Éclairs en série',
        'Left-Sided Shockwave/Right-Sided Shockwave': 'Onde de choc gauche/droite',
        'Lethal Blow': 'Charge ultime',
        'Lingering Miasma': 'Nuage miasmatique',
        'Lots Cast': 'Bombe ensorcelée',
        'Maelstrom\'s Bolt': 'Fulmination',
        'Malediction of Agony': 'Malédiction lancinante',
        'Malediction of Ruin': 'Malédiction dévastatrice',
        'Mana Flame': 'Flammes de mana',
        'Manifest Avatar': 'Clonage',
        'Manipulate Miasma': 'Contrôle des miasmes',
        'Memory of the Labyrinth': 'Appel du seigneur du dédale',
        'Merciful Arc': 'Éventail rédempteur',
        'Merciful Blooms': 'Kasha rédempteur',
        'Merciful Breeze': 'Yukikaze rédempteur',
        'Merciful Moon': 'Gekkô rédempteur',
        'Mercy Fourfold': 'Quatuor de lames rédemptrices',
        'Metamorphose': 'Nature changeante',
        'Misty Wraith': 'spectre vaporeux',
        'Northswain\'s Glow': 'Étoile du Nord',
        'Optimal Offensive': 'Charge de maître d\'armes',
        'Optimal Play': 'Technique de maître d\'armes',
        'Pawn Off': 'Sabre tournoyant',
        'Phantom Edge': 'Épées spectrales',
        'Queen\'s Edict': 'Injonction de Gunnhildr',
        'Queen\'s Justice': 'Châtiment royal',
        'Queen\'s Shot': 'Tir tous azimuts',
        'Queen\'s Will': 'Édit de Gunnhildr',
        'Quick March': 'Ordre de marche',
        'Rapid Bolts': 'Torrent d\'éclairs',
        'Rapid Sever': 'Tranchage rapide',
        'Reading': 'Analyse des faiblesses',
        'Relentless Battery': 'Attaque coordonnée',
        'Relentless Play': 'Ordre d\'attaque coordonnée',
        'Rending Bolt': 'Pluie de foudre',
        'Reverberating Roar': 'Cri disloquant',
        'Reversal Of Forces': 'Inversion des masses',
        'Right-Sided Shockwave/Left-Sided Shockwave': 'Onde de choc droite/gauche',
        'Ruins Golem': 'golem des ruines',
        'Sanguine Clot': 'caillot terrifiant',
        'Seasons Of Mercy': 'Setsugekka rédempteur',
        'Second Mercy': 'Deuxième lame rédemptrice',
        'Secrets Revealed': 'Corporification',
        'Shield Omen/Sword Omen': 'Posture du bouclier/épée',
        'Shimmering Shot': 'Flèches scintillantes',
        'Shot In The Dark': 'Tir à une main',
        'Sniper Shot': 'Entre les yeux',
        'Spiritual Sphere': 'sphère immatérielle',
        'Spit Flame': 'Crachat enflammé',
        'Spiteful Spirit': 'Sphère de brutalité',
        'Strongpoint Defense': 'Défense absolue',
        'Summon(?! Adds)': 'Invocation',
        'Summon Adds': 'Ajouts d\'invocation',
        'Sun\'s Ire': 'Ire ardente',
        'Surge of Vigor': 'Zèle',
        'Surging Flames': 'Déferlante de feu',
        'Surging Flood': 'Déferlante d\'eau',
        'Swirling Miasma': 'Anneau miasmatique',
        'Sword Omen/Shield Omen': 'Posture de l\'épée/bouclier',
        'The Ends': 'Croix lacérante',
        'The Means': 'Croix perforante',
        'Third Mercy': 'Troisième lame rédemptrice',
        'Thunderous Discharge': 'Déflagration de foudre',
        'Turret\'s Tour': 'Ricochets frénétiques',
        'Undying Hatred': 'Psychokinèse',
        'Unlucky Lot': 'Déflagration éthérée',
        'Unrelenting Charge': 'Charge frénétique',
        'Unseen Eye': 'Spectres de l\'ouragan de fleurs',
        'Unwavering Apparition': 'Spectres du chevalier implacable',
        'Verdant Path': 'École de la Voie verdoyante',
        'Verdant Tempest': 'Tempête de la Voie verdoyante',
        'Vicious Swipe': 'Vrille tranchante',
        'Vile Wave': 'Vague de malveillance',
        'Viscous Clot': 'caillot visqueux',
        'Weave Miasma': 'Miasmologie',
        'Weight Of Fortune': 'Pesanteur excessive',
        'Whack': 'Tannée',
        'Winds Of Fate': 'Tornade puissante',
        'Winds Of Weight': 'Pesanteur et légèreté',
        'Withering Curse': 'Malédiction de nanisme',
        'Wrath Of Bozja': 'Courroux de Bozja',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        '(?<!Crowned )Marchosias': 'マルコシアス',
        'Aetherial Bolt': '魔弾',
        'Aetherial Burst': '大魔弾',
        'Aetherial Orb': '魔力塊',
        'Aetherial Sphere': '魔気',
        'Aetherial Ward': '魔法障壁',
        'Automatic Turret': 'オートタレット',
        'Avowed Avatar': 'アヴァウドの分体',
        'Ball Lightning': '雷球',
        'Ball Of Fire': '火炎球',
        'Bicolor Golem': 'バイカラー・ゴーレム',
        'Bozjan Phantom': 'ボズヤ・ファントム',
        'Bozjan Soldier': 'ボズヤ・ソルジャー',
        'Crowned Marchosias': 'アルファ・マルコシアス',
        'Dahu': 'ダウー',
        'Grim Reaper': 'グリムクリーバー',
        'Gun Turret': 'ガンタレット',
        'Immolating Flame': '大火焔',
        'Pride of the Lion(?!ess)': '雄獅子の広間',
        'Pride of the Lioness': '雌獅子の加護',
        'Queen\'s Gunner': 'クイーンズ・ガンナー',
        'Queen\'s Knight': 'クイーンズ・ナイト',
        'Queen\'s Soldier': 'クイーンズ・ソルジャー',
        'Queen\'s Warrior': 'クイーンズ・ウォリアー',
        'Queensheart': '巫女たちの広間',
        'Ruins Golem': 'ルーイン・ゴーレム',
        'Sanguine Clot': 'オウガリッシュ・クロット',
        'Seeker Avatar': 'シーカーの分体',
        'Soldier Avatar': 'ソルジャーの分体',
        'Spark Arrow': 'ファイアアロー',
        'Spiritual Sphere': '霊気',
        'Stuffy Wraith': 'スタフィー・レイス',
        'Stygimoloch Lord': 'スティギモロク・ロード',
        'Stygimoloch Monk': 'スティギモロク',
        'Stygimoloch Warrior': 'スティギモロク・ウォリアー',
        'Tempestuous Orb': '大氷球',
        'The Hall of Hieromancy': '託宣所',
        'The Hall of Supplication': '大祈祷所',
        'The Path of Divine Clarity': '命の至聖所',
        'The Queen': 'セイブ・ザ・クイーン',
        'The Theater of One': '円形劇場跡',
        'The Vault of Singing Crystal': '響き合う水晶の間',
        'Trinity Avowed': 'トリニティ・アヴァウド',
        'Trinity Seeker': 'トリニティ・シーカー',
        'Viscous Clot': 'ヴィスカス・クロット',
        'Why\\.\\.\\.won\'t\\.\\.\\.you\\.\\.\\.': 'グオオオォォ…… 敗レル……ナンテ……',
      },
      'replaceText': {
        '(?<!C)Rush': '突進',
        '(?<!Inescapable )Entrapment': '掛罠',
        '--adds--': '--雑魚--',
        '--chains--': '--鎖--',
        '1111-Tonze Swing': '1111トンズ・スイング',
        'Above Board': '浮遊波',
        'Act Of Mercy': '破天鋭刃風',
        'Allegiant Arsenal': 'ウェポンチェンジ',
        'Aura Sphere': '闘気',
        'Automatic Turret': 'オートタレット',
        'Baleful Blade': '豪剣強襲撃',
        'Baleful Comet': '豪剣焔襲撃',
        'Baleful Firestorm': '豪剣魔炎旋',
        'Baleful Onslaught': '豪剣激烈斬',
        'Baleful Swathe': '豪剣黒流破',
        'Beck And Call To Arms': '攻撃命令',
        'Blade Of Entropy': '氷炎刃',
        'Blood And Bone': '波動斬',
        'Bloody Wraith': 'ブラッディ・レイス',
        'Bombslinger': '爆弾投擲',
        'Boost': 'ためる',
        'Bozjan Soldier': 'ボズヤ・ソルジャー',
        'Burn': '燃焼',
        'Cleansing Slash': '乱命割殺斬',
        'Coat Of Arms': '偏向防御',
        'Coerce': '強要',
        'Core Combustion': '心核熱',
        'Crazed Rampage': 'キリキリ舞い',
        'Creeping Miasma': '瘴気流',
        'Crushing Hoof': '重圧殺',
        'Dead Iron': '熱拳振動波',
        'Death Scythe': 'デスサイズ',
        'Devastating Bolt': '激雷',
        'Devour': '捕食',
        'Double Gambit': '幻影術',
        'Elemental Brand': '氷炎の呪印',
        'Elemental Impact': '着弾',
        'Empyrean Iniquity': '天魔鬼神爆',
        'Excruciation': '激痛',
        'Falling Rock': '落石',
        'Fateful Words': '呪いの言葉',
        'Feral Howl': 'フェラルハウル',
        'Fiery Portent': '熱気術',
        'Firebreathe': 'ラーヴァブレス',
        'First Mercy': '初手：鋭刃四刀の構え',
        'Flailing Strike': '回転乱打',
        'Flames Of Bozja': 'フレイム・オブ・ボズヤ',
        'Flashvane': 'フラッシュアロー',
        'Focused Tremor': '局所地震',
        'Foe Splitter': 'マキ割り',
        'Fool\'s Gambit': '幻惑術',
        'Forceful Strike': '剛力の一撃',
        'Fourth Mercy': '四手：鋭刃四刀の構え',
        'Fracture': '炸裂',
        'Freedom Of Bozja': 'リバティ・オブ・ボズヤ',
        'Fury Of Bozja': 'フューリー・オブ・ボズヤ',
        'Gleaming Arrow': 'グリッターアロー',
        'Glory Of Bozja': 'グローリー・オブ・ボズヤ',
        'Gods Save The Queen': 'ゴッド・セイブ・ザ・クイーン',
        'Great Ball Of Fire': '火球',
        'Gun Turret': 'ガンタレット',
        'Gunnhildr\'s Blades': 'グンヒルドの剣',
        'Head Down': 'ビーストチャージ',
        'Heaven\'s Wrath': '聖光爆裂斬',
        'Higher Power': '雷気充填',
        'Hot And Cold': '氷炎乱流',
        'Hot Charge': 'ホットチャージ',
        'Hunter\'s Claw': 'ハンタークロウ',
        'Hysteric Assault': 'ヒステリックアサルト',
        'Ice Spikes': 'アイススパイク',
        'Icy Portent': '冷気術',
        'Inescapable Entrapment': '掛罠祭り',
        'Infernal Slash': 'ヤーマスラッシュ',
        'Invert Miasma': '反転瘴気操作',
        'Iron Impact': '熱拳烈気砲',
        'Iron Rose': '熱拳闘気砲',
        'Iron Splitter': '熱拳地脈爆',
        'Judgment Blade': '不動無明剣',
        'Labyrinthine Fate': '迷宮王の呪い',
        'Leaping Spark': '連雷',
        'Left-Sided Shockwave': 'レフトサイド・ショックウェーブ',
        'Lethal Blow': '必殺の一撃',
        'Lingering Miasma': '瘴気雲',
        'Lots Cast': '魔爆発',
        'Maelstrom\'s Bolt': '天鼓雷音稲妻斬',
        'Malediction of Agony': '苦悶の呪詛',
        'Malediction of Ruin': '破滅の呪詛',
        'Mana Flame': 'マナフレイム',
        'Manifest Avatar': '分体生成',
        'Manipulate Miasma': '瘴気操作',
        'Memory of the Labyrinth': '迷宮王の大号令',
        'Merciful Arc': '鋭刃舞踏扇',
        'Merciful Blooms': '鋭刃花車',
        'Merciful Breeze': '鋭刃雪風',
        'Merciful Moon': '鋭刃月光',
        'Mercy Fourfold': '鋭刃四刀流',
        'Metamorphose': '性質変化',
        'Misty Wraith': 'ミスティ・レイス',
        'Northswain\'s Glow': '北斗骨砕斬',
        'Optimal Offensive': '武装突撃',
        'Optimal Play': '武装戦技',
        'Pawn Off': '旋回刃',
        'Phantom Edge': '霊幻剣',
        'Queen\'s Edict': '女王の大勅令',
        'Queen\'s Justice': '処罰令',
        'Queen\'s Shot': '全方位射撃',
        'Queen\'s Will': '女王の勅令',
        'Quick March': '行軍命令',
        'Rapid Bolts': '多重雷',
        'Rapid Sever': '滅多斬り',
        'Reading': '解析',
        'Relentless Battery': '連携戦技',
        'Relentless Play': '連携命令',
        'Rending Bolt': '雷鳴落',
        'Reverberating Roar': '崩落誘発',
        'Reversal Of Forces': '質量転換',
        'Right-Sided Shockwave': 'ライトサイド・ショックウェーブ',
        'Ruins Golem': 'ルーイン・ゴーレム',
        'Sanguine Clot': 'オウガリッシュ・クロット',
        'Seasons Of Mercy': '鋭刃雪月花',
        'Second Mercy': '二手：鋭刃四刀の構え',
        'Secrets Revealed': '実体結像',
        'Shield Omen': '盾の型',
        'Shimmering Shot': 'トゥインクルアロー',
        'Shot In The Dark': '片手撃ち',
        'Sniper Shot': '狙撃',
        'Spiritual Sphere': '霊気',
        'Spit Flame': 'フレイムスピット',
        'Spiteful Spirit': '闘気',
        'Strongpoint Defense': '絶対防御',
        'Summon Adds': '雑魚召喚',
        'Summon(?! Adds)': '召喚',
        'Sun\'s Ire': '焼討ち',
        'Surge of Vigor': '奮発',
        'Surging Flames': '火攻め',
        'Surging Flood': '水攻め',
        'Swirling Miasma': '瘴気輪',
        'Sword Omen': '剣の型',
        'The Ends': '十字斬',
        'The Means': '十字撃',
        'Third Mercy': '三手：鋭刃四刀の構え',
        'Thunderous Discharge': '雷気発散',
        'Turret\'s Tour': '跳弾乱舞',
        'Undying Hatred': '超ねんりき',
        'Unlucky Lot': '魔爆',
        'Unrelenting Charge': '爆進',
        'Unseen Eye': '花嵐の幻影',
        'Unwavering Apparition': '羅刹の幻影',
        'Verdant Path': '翠流派',
        'Verdant Tempest': '翠流魔風塵',
        'Vicious Swipe': 'キリ揉み',
        'Vile Wave': '悪意の波動',
        'Viscous Clot': 'ヴィスカス・クロット',
        'Weave Miasma': '瘴気術',
        'Weight Of Fortune': '過重力',
        'Whack': '乱打',
        'Winds Of Fate': '大烈風',
        'Winds Of Weight': '過重烈風',
        'Withering Curse': 'こびとの呪い',
        'Wrath Of Bozja': 'ラース・オブ・ボズヤ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '(?<!Crowned )Marchosias': '马可西亚斯',
        'Aetherial Bolt': '魔弹',
        'Aetherial Burst': '大魔弹',
        'Aetherial Orb': '魔力块',
        'Aetherial Sphere': '魔气',
        'Aetherial Ward': '魔法障壁',
        'Automatic Turret': '自动炮塔',
        'Avowed Avatar': '誓约之分身',
        'Ball Lightning': '雷球',
        'Ball Of Fire': '火球',
        'Bicolor Golem': '双色巨像',
        'Bozjan Phantom': '博兹雅幻灵',
        'Bozjan Soldier': '博兹雅士兵',
        'Crowned Marchosias': '首领马可西亚斯',
        'Dahu': '大兀',
        'Grim Reaper': '死亡收割者',
        'Gun Turret': '射击炮台',
        'Immolating Flame': '大火焰',
        'Pride of the Lion(?!ess)': '雄狮大厅',
        'Pride of the Lioness': '雌狮大厅',
        'Queen\'s Gunner': '女王枪手',
        'Queen\'s Knight': '女王骑士',
        'Queen\'s Soldier': '女王士兵',
        'Queen\'s Warrior': '女王战士',
        'Queensheart': '巫女大厅',
        'Ruins Golem': '毁灭巨像',
        'Sanguine Clot': '血色凝块',
        'Seeker Avatar': '求道之分身',
        'Soldier Avatar': '士兵的分身',
        'Spark Arrow': '火光箭',
        'Spiritual Sphere': '灵气',
        'Stuffy Wraith': '沉闷幽灵',
        'Stygimoloch Lord': '冥河之王',
        'Stygimoloch Monk': '冥河武僧',
        'Stygimoloch Warrior': '冥河战士',
        'Tempestuous Orb': '大冰球',
        'The Hall of Hieromancy': '神谕所',
        'The Hall of Supplication': '大祈祷所',
        'The Path of Divine Clarity': '生命至圣所',
        'The Queen': '天佑女王',
        'The Theater of One': '圆形剧场遗迹',
        'The Vault of Singing Crystal': '和鸣水晶之间',
        'Trinity Avowed': '誓约之三位一体',
        'Trinity Seeker': '求道之三位一体',
        'Viscous Clot': '粘液凝块',
        'Why\\.\\.\\.won\'t\\.\\.\\.you\\.\\.\\.': '呜哦哦哦哦…… 难道会……输掉吗……',
      },
      'replaceText': {
        '(?<!C)Rush': '突进',
        '(?<!Inescapable )Entrapment': '设置陷阱',
        '--Spite Check--': '--斗气波--',
        '--adds--': '--小怪--',
        '--bleed--': '--出血--',
        '--chains--': '--锁链--',
        '--stunned--': '--眩晕--',
        '--tethers--': '--连线--',
        '--unstunned--': '--眩晕结束--',
        '1111-Tonze Swing': '千百十一吨回转',
        'Above Board': '浮游波',
        'Act Of Mercy': '破天慈刃风',
        'Allegiant Arsenal': '变换武器',
        'Aura Sphere': '斗气',
        'Automatic Turret': '自动炮塔',
        'Baleful Blade': '豪剑强袭击',
        'Baleful Comet': '豪剑焰袭击',
        'Baleful Firestorm': '豪剑魔炎旋',
        'Baleful Onslaught': '豪剑激烈斩',
        'Baleful Swathe': '豪剑黑流破',
        'Beck And Call To Arms': '攻击命令',
        'Blade Of Entropy': '冰炎刃',
        'Blood And Bone': '波动斩',
        'Bloody Wraith': '血腥幽灵',
        'Bombslinger': '投掷炸弹',
        'Boost': '蓄力',
        'Bozjan Soldier': '博兹雅士兵',
        'Burn': '燃烧',
        'Cleansing Slash': '乱命割杀斩',
        'Coat Of Arms': '偏向防御',
        'Coerce': '强迫',
        'Core Combustion': '核心燃烧',
        'Crazed Rampage': '狂暴乱舞',
        'Creeping Miasma': '瘴气流',
        'Crushing Hoof': '重压杀',
        'Dead Iron': '热拳振动波',
        'Death Scythe': '死镰',
        'Devastating Bolt': '激雷',
        'Devour': '捕食',
        'Double Gambit': '幻影术',
        'Elemental Arrow': '元素箭',
        'Elemental Blast': '元素爆破',
        'Elemental Brand': '冰炎咒印',
        'Elemental Impact': '中弹',
        'Empyrean Iniquity': '天魔鬼神爆',
        'Excruciation': '剧痛',
        'Falling Rock': '落石',
        'Fateful Words': '诅咒的危言',
        'Feral Howl': '野性嚎叫',
        'Fiery Portent': '热浪术',
        'Firebreathe': '岩浆吐息',
        'First Mercy': '慈悲四刀第一念',
        'Flailing Strike': '回转乱打',
        'Flames Of Bozja': '博兹雅火焰',
        'Flashvane': '闪光箭',
        'Focused Tremor': '局部地震',
        'Foe Splitter': '劈裂',
        'Fool\'s Gambit': '幻惑术',
        'Forceful Strike': '刚力一击',
        'Fourth Mercy': '慈悲四刀第四念',
        'Fracture': '炸裂',
        'Freedom Of Bozja': '博兹雅之自由',
        'Fury Of Bozja': '博兹雅之怒',
        'Gleaming Arrow': '闪耀箭',
        'Glory Of Bozja': '博兹雅之荣',
        'Gods Save The Queen': '神佑女王',
        'Great Ball Of Fire': '火球',
        'Gun Turret': '射击炮台',
        'Gunnhildr\'s Blades': '女王之刃',
        'Head Down': '兽性冲击',
        'Heaven\'s Wrath': '圣光爆裂斩',
        'Higher Power': '雷气充填',
        'Hot And Cold': '冰炎乱流',
        'Hot Charge': '炽热冲锋',
        'Hunter\'s Claw': '狩猎者之爪',
        'Hysteric Assault': '癫狂突袭',
        'Ice Spikes': '冰棘屏障',
        'Icy Portent': '寒气术',
        'Inescapable Entrapment': '陷阱狂欢',
        'Infernal Slash': '地狱斩',
        'Invert Miasma': '瘴气反转',
        'Iron Impact': '热拳烈气炮',
        'Iron Rose': '热拳斗气炮',
        'Iron Splitter': '热拳地脉爆',
        'Judgment Blade': '不动无明剑',
        'Labyrinthine Fate': '迷宫王的诅咒',
        'Leaping Spark': '连雷',
        'Left-Sided Shockwave': '左侧震荡波',
        'Lethal Blow': '必杀一击',
        'Lingering Miasma': '瘴气云',
        'Lots Cast': '魔爆炸',
        'Maelstrom\'s Bolt': '天鼓雷音惊电斩',
        'Malediction of Agony': '苦闷的诅咒',
        'Malediction of Ruin': '破灭的诅咒',
        'Mana Flame': '魔力之炎',
        'Manifest Avatar': '生成分裂体',
        'Manipulate Miasma': '操作瘴气',
        'Memory of the Labyrinth': '迷宫王的大号令',
        'Merciful Arc': '慈悲舞动扇',
        'Merciful Blooms': '慈悲花车',
        'Merciful Breeze': '慈悲雪风',
        'Merciful Moon': '慈悲月光',
        'Mercy Fourfold': '慈悲四刀流',
        'Metamorphose': '变换属性',
        'Misty Wraith': '迷雾幽灵',
        'Northswain\'s Glow': '北斗骨碎斩',
        'Optimal Offensive': '武装突击',
        'Optimal Play': '武装战技',
        'Pawn Off': '旋回刃',
        'Phantom Edge': '灵幻剑',
        'Queen\'s Edict': '女王的大敕令',
        'Queen\'s Justice': '处罚令',
        'Queen\'s Shot': '全方位射击',
        'Queen\'s Will': '女王的敕令',
        'Quick March': '行军指令',
        'Rapid Bolts': '多重雷',
        'Rapid Sever': '急促斩击',
        'Reading': '解析',
        'Relentless Battery': '协作战技',
        'Relentless Play': '协作指令',
        'Rending Bolt': '雷鸣落',
        'Reverberating Roar': '引发崩塌',
        'Reversal Of Forces': '质量转换',
        'Right-Sided Shockwave': '右侧震荡波',
        'Ruins Golem': '毁灭巨像',
        'Sanguine Clot': '血色凝块',
        'Seasons Of Mercy': '慈悲雪月花',
        'Second Mercy': '慈悲四刀第二念',
        'Secrets Revealed': '实体成像',
        'Shield Omen': '盾型',
        'Shimmering Shot': '闪烁箭',
        'Shot In The Dark': '单手射击',
        'Sniper Shot': '狙击',
        'Spiritual Sphere': '灵气',
        'Spit Flame': '火涎',
        'Spiteful Spirit': '斗气',
        'Strongpoint Defense': '绝对防御',
        'Summon Adds': '召唤小怪',
        'Summon(?! Adds)': '召唤',
        'Sun\'s Ire': '太阳之怒',
        'Surge of Vigor': '奋发',
        'Surging Flames': '火攻',
        'Surging Flood': '水攻',
        'Swirling Miasma': '瘴气圈',
        'Sword Omen': '剑型',
        'The Ends': '十字斩',
        'The Means': '十字击',
        'Third Mercy': '慈悲四刀第三念',
        'Thunderous Discharge': '雷气散发',
        'Turret\'s Tour': '跳弹乱舞',
        'Undying Hatred': '超念力',
        'Unlucky Lot': '魔爆',
        'Unrelenting Charge': '高速冲锋',
        'Unseen Eye': '风花舞的幻影',
        'Unwavering Apparition': '罗刹的幻影',
        'Verdant Path': '翠青流',
        'Verdant Tempest': '翠青魔风尘',
        'Vicious Swipe': '狂暴回转',
        'Vile Wave': '恶意的波动',
        'Viscous Clot': '粘液凝块',
        'Weave Miasma': '瘴气术',
        'Weight Of Fortune': '过重力',
        'Whack': '乱打',
        'Winds Of Fate': '大烈风',
        'Winds Of Weight': '过重烈风',
        'Withering Curse': '小人诅咒',
        'Wrath Of Bozja': '博兹雅之愤',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '(?<!Crowned )Marchosias': '마르코시아스',
        'Aetherial Bolt': '마탄',
        'Aetherial Burst': '대마탄',
        'Aetherial Orb': '마력 덩어리',
        'Aetherial Sphere': '마기',
        'Aetherial Ward': '마법 장벽',
        'Automatic Turret': '자동포탑',
        'Avowed Avatar': '맹세의 분열체',
        'Ball Lightning': '뇌구',
        'Ball Of Fire': '화염구',
        'Bicolor Golem': '두 빛깔 골렘',
        'Bozjan Phantom': '보즈야 유령',
        'Bozjan Soldier': '보즈야 병사',
        'Crowned Marchosias': '우두머리 마르코시아스',
        'Dahu': '다후',
        'Grim Reaper': '음산한 난도자',
        'Gun Turret': '총포탑',
        'Immolating Flame': '대화염',
        'Pride of the Lion(?!ess)': '수사자의 방',
        'Pride of the Lioness': '암사자의 방',
        'Queen\'s Gunner': '여왕의 총사',
        'Queen\'s Knight': '여왕의 기사',
        'Queen\'s Soldier': '여왕의 병사',
        'Queen\'s Warrior': '여왕의 전사',
        'Queensheart': '무녀들의 방',
        'Ruins Golem': '유적 골렘',
        'Sanguine Clot': '핏빛 멍울',
        'Seeker Avatar': '탐구의 분열체',
        'Soldier Avatar': '병사 분열체',
        'Spark Arrow': '불꽃 화살',
        'Spiritual Sphere': '영기',
        'Stuffy Wraith': '케케묵은 망령',
        'Stygimoloch Lord': '스티키몰로크 군주',
        'Stygimoloch Monk': '스티키몰로크',
        'Stygimoloch Warrior': '스티기몰로크 전사',
        'Tempestuous Orb': '거대 얼음 구체',
        'The Hall of Hieromancy': '신탁소',
        'The Hall of Supplication': '대기도소',
        'The Path of Divine Clarity': '생명의 지성소',
        'The Queen': '세이브 더 퀸',
        'The Theater of One': '원형 극장 옛터',
        'The Vault of Singing Crystal': '공명하는 수정의 방',
        'Trinity Avowed': '맹세의 삼위일체',
        'Trinity Seeker': '탐구의 삼위일체',
        'Viscous Clot': '찐득한 멍울',
        'Why\\.\\.\\.won\'t\\.\\.\\.you\\.\\.\\.': '그어어어어…… 내가…… 지다니……',
      },
      'replaceText': {
        '(?<!C)Rush': '돌진',
        '(?<!Inescapable )Entrapment': '함정 놓기',
        '--Spite Check--': '--투기파--',
        '--adds--': '--쫄--',
        '--bleed--': '--고통--',
        '--chains--': '--사슬--',
        '--stunned--': '--기절--',
        '--tethers--': '--선 연결--',
        '--unstunned--': '--기절풀림--',
        '1111-Tonze Swing': '1111톤즈 휘두르기',
        'Above Board': '부유파',
        'Act Of Mercy': '예리한 파천풍',
        'Allegiant Arsenal': '무기 변경',
        'Aura Sphere': '투기',
        'Automatic Turret': '자동포탑',
        'Baleful Blade': '호검 강습 공격',
        'Baleful Comet': '호검 화염 습격',
        'Baleful Firestorm': '호검 마염선',
        'Baleful Onslaught': '호검 격렬참',
        'Baleful Swathe': '호검 흑류파',
        'Beck And Call To Arms': '공격 명령',
        'Blade Of Entropy': '얼음불 칼날',
        'Blood And Bone': '파동참',
        'Bloody Wraith': '핏빛 망령',
        'Bombslinger': '폭탄 투척',
        'Boost': '힘 모으기',
        'Bozjan Soldier': '보즈야 병사',
        'Burn': '연소',
        'Cleansing Slash': '난명할살참',
        'Coat Of Arms': '편향 방어',
        'Coerce': '강요',
        'Core Combustion': '심핵열',
        'Crazed Rampage': '나사 튕기기',
        'Creeping Miasma': '독기 흐름',
        'Crushing Hoof': '육중한 압살',
        'Dead Iron': '불주먹 진동파',
        'Death Scythe': '죽음의 낫',
        'Devastating Bolt': '격뢰',
        'Devour': '포식',
        'Double Gambit': '환영술',
        'Elemental Arrow': '속성 화살',
        'Elemental Blast': '속성 운석 폭발',
        'Elemental Brand': '얼음불 저주',
        'Elemental Impact': '착탄',
        'Empyrean Iniquity': '천마귀신폭',
        'Excruciation': '격통',
        'Falling Rock': '낙석',
        'Fateful Words': '저주의 말',
        'Feral Howl': '야성의 포효',
        'Fiery Portent': '열기술',
        'Firebreathe': '용암숨',
        'First Mercy': '예리한 첫 번째 검',
        'Flailing Strike': '회전 난타',
        'Flames Of Bozja': '보즈야 플레임',
        'Flashvane': '섬광 화살',
        'Focused Tremor': '국소 지진',
        'Foe Splitter': '장작 패기',
        'Fool\'s Gambit': '환혹술',
        'Forceful Strike': '강력한 일격',
        'Fourth Mercy': '예리한 네 번째 검',
        'Fracture': '작렬',
        'Freedom Of Bozja': '보즈야의 자유',
        'Fury Of Bozja': '보즈야의 분노',
        'Gleaming Arrow': '현란한 화살',
        'Glory Of Bozja': '보즈야의 영광',
        'Gods Save The Queen': '갓 세이브 더 퀸',
        'Great Ball Of Fire': '불덩이',
        'Gun Turret': '총포탑',
        'Gunnhildr\'s Blades': '군힐드의 검',
        'Head Down': '야수 돌격',
        'Heaven\'s Wrath': '성광폭렬참',
        'Higher Power': '화력 보강',
        'Hot And Cold': '빙염난류',
        'Hot Charge': '맹렬한 돌진',
        'Hunter\'s Claw': '사냥꾼의 발톱',
        'Hysteric Assault': '발작 습격',
        'Ice Spikes': '얼음 보호막',
        'Icy Portent': '냉기술',
        'Inescapable Entrapment': '함정 대잔치',
        'Infernal Slash': '연옥 베기',
        'Invert Miasma': '반전 독기 조작',
        'Iron Impact': '불주먹 열기포',
        'Iron Rose': '불주먹 투기포',
        'Iron Splitter': '불주먹 지맥 폭발',
        'Judgment Blade': '부동무명검',
        'Labyrinthine Fate': '미궁왕의 저주',
        'Leaping Spark': '연속 번개',
        'Left-Sided Shockwave': '왼쪽 충격파',
        'Lethal Blow': '필살의 일격',
        'Lingering Miasma': '독기 구름',
        'Lots Cast': '마폭발',
        'Maelstrom\'s Bolt': '천고뇌음 번개 베기',
        'Malediction of Agony': '고통의 저주',
        'Malediction of Ruin': '파멸의 저주',
        'Mana Flame': '마나 불꽃',
        'Manifest Avatar': '분열체 생성',
        'Manipulate Miasma': '독기 조작',
        'Memory of the Labyrinth': '미궁왕의 대호령',
        'Merciful Arc': '예리한 부채검',
        'Merciful Blooms': '예리한 화차',
        'Merciful Breeze': '예리한 설풍',
        'Merciful Moon': '예리한 월광',
        'Mercy Fourfold': '예리한 사도류',
        'Metamorphose': '성질 변화',
        'Misty Wraith': '안개 망령',
        'Northswain\'s Glow': '북두골쇄참',
        'Optimal Offensive': '무장 돌격',
        'Optimal Play': '무장 전술',
        'Pawn Off': '선회인',
        'Phantom Edge': '영환검',
        'Queen\'s Edict': '여왕의 대칙령',
        'Queen\'s Justice': '처벌령',
        'Queen\'s Shot': '전방위 사격',
        'Queen\'s Will': '여왕의 칙령',
        'Quick March': '행군 명령',
        'Rapid Bolts': '다중 번개',
        'Rapid Sever': '마구 베기',
        'Reading': '해석',
        'Relentless Battery': '연계 전술',
        'Relentless Play': '연계 명령',
        'Rending Bolt': '번개 떨구기',
        'Reverberating Roar': '낙석 유발',
        'Reversal Of Forces': '질량 전환',
        'Right-Sided Shockwave': '오른쪽 충격파',
        'Ruins Golem': '유적 골렘',
        'Sanguine Clot': '핏빛 멍울',
        'Seasons Of Mercy': '예리한 설월화',
        'Second Mercy': '예리한 두 번째 검',
        'Secrets Revealed': '실체 이루기',
        'Shield Omen': '방패 태세',
        'Shimmering Shot': '반짝반짝 화살',
        'Shot In The Dark': '한손 쏘기',
        'Sniper Shot': '저격',
        'Spiritual Sphere': '영기',
        'Spit Flame': '화염 뱉기',
        'Spiteful Spirit': '투기',
        'Strongpoint Defense': '절대 방어',
        'Summon Adds': '쫄 소환',
        'Summon(?! Adds)': '소환',
        'Sun\'s Ire': '태워 없애기',
        'Surge of Vigor': '발분',
        'Surging Flames': '불공격',
        'Surging Flood': '물공격',
        'Swirling Miasma': '독기 고리',
        'Sword Omen': '검 태세',
        'The Ends': '십자참',
        'The Means': '십자격',
        'Third Mercy': '예리한 세 번째 검',
        'Thunderous Discharge': '번개 발산',
        'Turret\'s Tour': '도탄난무',
        'Undying Hatred': '초염력',
        'Unlucky Lot': '마폭',
        'Unrelenting Charge': '폭주 돌진',
        'Unseen Eye': '꽃폭풍의 환영',
        'Unwavering Apparition': '나찰의 환영',
        'Verdant Path': '취일문 유파',
        'Verdant Tempest': '취일문 마풍진',
        'Vicious Swipe': '나사 돌리기',
        'Vile Wave': '악의의 파동',
        'Viscous Clot': '찐득한 멍울',
        'Weave Miasma': '독기술',
        'Weight Of Fortune': '무거운 무게',
        'Whack': '난타',
        'Winds Of Fate': '대열풍',
        'Winds Of Weight': '무거운 바람',
        'Withering Curse': '작아지는 저주',
        'Wrath Of Bozja': '보즈야의 격노',
      },
    },
  ],
};

export default triggerSet;
