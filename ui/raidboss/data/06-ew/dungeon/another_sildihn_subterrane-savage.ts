import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Gladiator triggers for gold/silver location using OverlayPlugin?
// TODO: Gladiator adjustments to timeline
// TODO: Shadowcaster Infern Brand 1 and 4 safe location triggers if possible
// TODO: Shadowcaster adjustments to timeline
// TODO: Automate keeping ASS and ASS(S) triggers/timeline in-sync

type RushVec = { x: number; y: number; l: number };

export interface Data extends RaidbossData {
  suds?: string;
  puffCounter: number;
  silkenPuffs: { [id: string]: { effect: string, location?: string } };
  freshPuff2SafeAlert?: string;
  soapCounter: number;
  beaterCounter: number;
  spreeCounter: number;
  mightCasts: PluginCombatantState[];
  mightDir?: string;
  hasLingering?: boolean;
  thunderousEchoPlayer?: string;
  arcaneFontCounter: number;
  myFlame?: number;
  brandEffects: { [effectId: number]: string };
  brandCounter: number;
  myLastCut?: number;
  firstColorCut?: 'orange' | 'blue';
  flamesCutCounter: number;
  waveCounter: number;
  //
  cleanSeen?: boolean;
  rushCounter: number;
  rushVecs: RushVec[];
  fateSeen?: boolean;
  explosionCounter: number;
  explosionTime: number;
  firesteelStrikes: string[];
}

const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const silkieCenterX = -335;
const silkieCenterY = -155;

const positionTo8Dir = (posX: number, posY: number, centerX: number, centerY: number) => {
  const relX = posX - centerX;
  const relY = posY - centerY;

  // Dirs: N = 0, NE = 1, ..., NW = 7
  return Math.round(4 - 4 * Math.atan2(relX, relY) / Math.PI) % 8;
};

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AnotherSildihnSubterraneSavage,
  timelineFile: 'another_sildihn_subterrane-savage.txt',
  initData: () => {
    return {
      puffCounter: 0,
      silkenPuffs: {},
      soapCounter: 0,
      beaterCounter: 0,
      spreeCounter: 0,
      mightCasts: [],
      arcaneFontCounter: 0,
      brandEffects: {},
      brandCounter: 0,
      flamesCutCounter: 0,
      waveCounter: 0,
      //
      rushCounter: 0,
      rushVecs: [],
      explosionCounter: 0,
      explosionTime: 0,
      firesteelStrikes: [],
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
      response: Responses.goRight(),
    },
    {
      id: 'ASSS Right Sweep',
      type: 'StartsUsing',
      netRegex: { id: '797B', source: 'Aqueduct Kaluk', capture: false },
      response: Responses.goLeft(),
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
      response: Responses.goRight(),
    },
    {
      id: 'ASSS Honeyed Right',
      type: 'StartsUsing',
      netRegex: { id: '7974', source: 'Aqueduct Udumbara', capture: false },
      response: Responses.goLeft(),
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
          en: '🟡비스듬 → 흩어져요',
          de: 'Kardinal',
          ja: '🟡斜め → 散会',
          ko: '십자방향으로',
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
      id: 'ASSS Fresh Puff Tracker',
      // Use this separate trigger to increment data.puffCounter,
      // since we have multiple triggers to handle different Fresh Puffs
      type: 'StartsUsing',
      netRegex: { id: '7789', source: 'Silkie', capture: false },
      preRun: (data) => {
        ++data.puffCounter;
        data.silkenPuffs = {};
        data.cleanSeen = false;
      },
      infoText: (data, _matches, output) => {
        if (data.puffCounter === 1)
          return output.p1!();
        else if (data.puffCounter === 2)
          return output.p2!();
        else if (data.puffCounter === 3)
          return output.p3!();
        else if (data.puffCounter === 4)
          return output.p4!();
        return output.px!();
      },
      outputStrings: {
        p1: {
          en: '솜털🔘세개 → 꼬리',
          ja: 'たま3個 → 水拭き',
        },
        p2: {
          en: '솜털🔘네개 → 안전지대 ',
          ja: 'たま4個, 安置を作りましょう',
        },
        p3: {
          en: '솜털🔘여덟개 → 항아리',
          ja: 'たま8個, がんばれ！！',
        },
        p4: {
          en: '솜털🔘네개 → 꼬리 유도',
          ja: 'たま4個 → しっぽ誘導',
        },
        px: {
          en: '솜털🔘나와요',
          ja: 'たま出ます',
        },
      },
    },
    {
      id: 'ASSS Silken Puff Suds Gain',
      type: 'GainsEffect',
      // Silken Puffs:
      // CE9 Bracing Suds (Wind / Donut)
      // CEA Chilling Suds (Ice / Cardinal)
      // CEB Fizzling Suds (Lightning / Intercardinal)
      netRegex: { target: 'Silken Puff', effectId: 'CE[9AB]' },
      condition: (data) => data.puffCounter < 4, // don't track for Fresh Puff 4
      delaySeconds: 0.2, // sometimes a small delay between effects and updated pos data
      promise: async (data, matches) => {
        let puffCombatantData = null;
        puffCombatantData = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.targetId, 16)],
        });
        if (puffCombatantData === null)
          return;
        if (puffCombatantData.combatants.length !== 1)
          return;
        const puff = puffCombatantData.combatants[0];
        if (!puff)
          return;
        const puffX = Math.floor(puff.PosX);
        const puffY = Math.floor(puff.PosY);
        const puffLoc = dirs[positionTo8Dir(puffX, puffY, silkieCenterX, silkieCenterY)];
        if (puffLoc !== undefined)
          data.silkenPuffs[matches.targetId] = { effect: matches.effectId, location: puffLoc };
      },
    },
    {
      id: 'ASSS Silken Puff Suds Lose',
      type: 'LosesEffect',
      // Silken Puffs:
      // CE9 Bracing Suds (Wind / Donut)
      // CEA Chilling Suds (Ice / Cardinal)
      // CEB Fizzling Suds (Lightning / Intercardinal)
      netRegex: { target: 'Silken Puff', effectId: 'CE[9AB]' },
      condition: (data) => data.puffCounter < 4, // don't track for Fresh Puff 4
      run: (data, matches) => delete data.silkenPuffs[matches.targetId],
    },
    {
      id: 'ASSS Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: { id: ['7774', '7778'], source: 'Silkie', capture: false },
      condition: (data) => {
        // 왼쪽도 그렇지만 엄청 패다보면(!) 기믹이 스킵되는데 7755, 7756이 스킵되버린다.
        if (data.cleanSeen)
          return false;
        data.cleanSeen = true;
        return true;
      },
      response: Responses.goLeft(),
    },
    {
      id: 'ASSS Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: { id: ['7775', '7779'], source: 'Silkie', capture: false },
      condition: (data) => {
        if (data.cleanSeen)
          return false;
        data.cleanSeen = true;
        return true;
      },
      response: Responses.goRight(),
    },
    {
      id: 'ASSS Silkie Suds Gain',
      // Silkie:
      // CE1 Bracing Suds (Wind / Donut)
      // CE2 Chilling Suds (Ice / Cardinal)
      // CE3 Fizzling Suds (Lightning / Intercardinal)
      type: 'GainsEffect',
      netRegex: { effectId: 'CE[1-3]', target: 'Silkie' },
      run: (data, matches) => data.suds = matches.effectId,
    },
    {
      id: 'ASSS Silkie Suds Lose',
      // Silkie:
      // CE1 Bracing Suds (Wind / Donut)
      // CE2 Chilling Suds (Ice / Cardinal)
      // CE3 Fizzling Suds (Lightning / Intercardinal)
      type: 'LosesEffect',
      netRegex: { effectId: 'CE[1-3]', target: 'Silkie', capture: false },
      run: (data) => delete data.suds,
    },
    {
      id: 'ASSS Fresh Puff 1', // 3 puffs in triangle formation
      type: 'StartsUsing',
      // use 7751/7752 (Squeaky Clean Left/Right), rather than 7766 (Fresh Puff)
      // Squeaky Clean will change the effects of two puffs after the Fresh Puff cast
      // so it is the easiest method to determine mechanic resolution
      netRegex: { id: '777[45]', source: 'Silkie' },
      condition: (data) => data.puffCounter === 1,
      delaySeconds: 9, // delay alert until after Squeaky Clean Left/Right completes to collect Silken Puff effects
      durationSeconds: 8, // keep alert up until just before Slippery Soap trigger fires
      alertText: (data, matches, output) => {
        if (Object.keys(data.silkenPuffs).length !== 3)
          return output.default!();

        const puffsByLoc: { [location: string]: string } = {};
        for (const puff of Object.values(data.silkenPuffs)) {
          if (puff.location !== undefined)
            puffsByLoc[puff.location] = puff.effect;
        }

        // See Silken Puff Suds Gain trigger for list of Silken Puff effectIds
        // By this point, Squeaky Clean Left/Right has changed the N puff and either the SW/SE puff to CE9 (Bracing Suds)
        // We only care about the unaffected puff's status effect (CEA/CEB) for resolving the mechanic.
        let stackDir = '';
        let safeDir = '';
        if (matches.id === '7774') { // Squeaky Clean Right - resolve based on SW puff's effect
          if (puffsByLoc.SW === undefined)
            return output.default!();
          stackDir = puffsByLoc.SW === 'CEA' ? 'SE' : 'N'; // if SW is ice, SE stack (unsafe later); if SW is lightning, N stack (unsafe later)
          safeDir = stackDir === 'SE' ? 'N' : 'SE'; // safeDir is the one we are not stacking at
        } else if (matches.id === '7775') { // Squeaky Clean Left - resolve based on SE puff's effect
          if (puffsByLoc.SE === undefined)
            return output.default!();
          stackDir = puffsByLoc.SE === 'CEA' ? 'SW' : 'N'; // if SE is ice, SW stack (unsafe later); if SE is lightning, N stack (unsafe later)
          safeDir = stackDir === 'SW' ? 'N' : 'SW';
        } else {
          return output.default!();
        }
        return output.stacksafe!({ dir1: output[stackDir]!(), dir2: output[safeDir]!() });
      },
      outputStrings: {
        N: Outputs.arrowN,
        SE: Outputs.arrowSE,
        SW: Outputs.arrowSW,
        stacksafe: {
          en: '뭉쳐욧: ${dir1} (나중에 ${dir2})',
        },
        default: {
          en: '🟢바로 밑으로',
        },
      },
    },
    {
      id: 'ASSS Slippery Soap',
      // Happens 5 times in the encounter
      type: 'StartsUsing',
      // this was originally triggered by 79FB, which is an (unmapped) ability targeting a player used by Silkie or Eastern Ewer
      // but it always happens at the same time that Silkie starts using 775E (the actual Slippery Soap cast)
      // so it's more accurate to fire this trigger based off of Silkie's cast
      netRegex: { id: '7781', source: 'Silkie' },
      preRun: (data) => data.soapCounter++,
      alertText: (data, matches, output) => {
        if (data.suds === 'CE1') {
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
          en: '솜털🔘의 맨 뒤로',
          de: 'Hinter Puschel und Gruppe',
          ja: 'たまの一番後ろへ',
          ko: '구슬 맨 뒤로',
        },
        getBehindPuffs: {
          en: '솜털🔘의 맨 뒤로 (동서)',
          de: 'Hinter Puschel und Gruppe (Osten/Westen)',
          ja: 'たまの一番後ろへ (東西)',
          ko: '구슬 맨 뒤로 (동/서)',
        },
        getBehindParty: {
          en: '맨 뒤로',
          de: 'Hinter Gruppe',
          ja: '一番後ろへ',
          ko: '맨 뒤로',
        },
        getBehindPartyKnockback: {
          en: '넉백! 맨 뒤로',
          de: 'Hinter Gruppe (Rückstoß)',
          ja: 'ノックバック！ 一番後ろへ',
          ko: '맨 뒤로 (넉백)',
        },
        getInFrontOfPlayer: {
          en: '${player} 앞으로',
          de: 'Sei vor ${player}',
          ja: '${player}の前へ',
          ko: '${player} 앞으로',
        },
        getInFrontOfPlayerKnockback: {
          en: '넉백! ${player} 앞으로',
          de: 'Sei vor ${player} (Rückstoß)',
          ja: 'ノックバック! ${player}の前へ',
          ko: '${player} 앞으로 (넉백)',
        },
      },
    },
    {
      id: 'ASSS Slippery Soap with Chilling Suds',
      type: 'StartsUsing',
      netRegex: { id: '7781', source: 'Silkie' },
      condition: (data) => data.suds === 'CE2',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      response: Responses.moveAround(),
    },
    {
      id: 'ASSS Slippery Soap After',
      type: 'Ability',
      netRegex: { id: '7781', source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case 'CE1':
            return output.getUnder!();
          case 'CE2':
            return output.intercards!();
          case 'CE3':
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
          ko: '십자방향으로 산개',
        },
        intercards: {
          en: '🔵십자 장판',
          ja: '🔵十字, 避けて',
          ko: '대각선 쪽으로',
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
            en: '내게 탱크버스터, 동서로 유도',
            de: 'Tank Buster auf DIR, Osten/Westen zwischen Puschel',
            ja: '自分にタンクバスタ、東西で誘導',
            ko: '나에게 탱버, 동/서쪽 구슬 사이로',
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
      condition: (data) => {
        ++data.spreeCounter; // increment regardless if condition ultimately returns true or false
        // skip trigger on 2nd & 3rd Fresh Puff  - those are handled by separate Fresh Puff triggers because safe area can be more nuanced
        return data.puffCounter !== 2 && data.puffCounter !== 3;
      },
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case 'CE1':
            return output.getUnder!();
          case 'CE2':
            return output.intercards!();
          default:
            if (data.spreeCounter === 1)
              return output.underPuff!();
            return output.avoidPuffs!();
        }
      },
      outputStrings: {
        getUnder: {
          en: '🟢바로 밑으로',
          ja: '🟢貼り付く',
        },
        intercards: {
          en: '🔵십자 장판',
          de: 'Interkardinal',
          fr: 'Intercardinal',
          ja: '🔵十字, 避けて',
          cn: '四角',
          ko: '대각선 쪽으로',
        },
        underPuff: {
          en: '🟢바로 밑으로',
          de: 'Unter grünem Puschel',
          ja: '🟢貼り付く',
          ko: '초록색 구슬 밑으로',
        },
        avoidPuffs: {
          en: '솜털🔘장판 피해요',
          de: 'Weiche den Puschel AoEs aus',
          ja: 'たまからのゆか避けて',
          ko: '구슬 장판 피하기',
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
    {
      id: 'ASSS Fresh Puff 2 Bait', // 4 puffs on cardinals or intercardinals with tethers
      type: 'Tether',
      netRegex: { source: 'Silken Puff' },
      condition: (data, matches) => matches.target === data.me && data.puffCounter === 2,
      durationSeconds: 6,
      alertText: (data, matches, output) => {
        const dirCards = ['N', 'E', 'S', 'W'];
        let silkieStatus = '';
        switch (data.suds) {
          case 'CE1': // Middle Safe
            silkieStatus = 'bossWind';
            break;
          case 'CE2': // Intercards Safe
            silkieStatus = 'bossIce';
            // never CE3 (lightning) for this mechanic
        }
        if (silkieStatus === '')
          return output.default!();

        const tetheredPuff = data.silkenPuffs[matches.sourceId];
        if (tetheredPuff === undefined)
          return;

        // See Silken Puff Suds Gain trigger for list of Silken Puff effectIds
        // Puff must be either CEA (Ice / blue) or CEB (Lightning / yellow) in this mechanic
        const puffEffect = tetheredPuff.effect === 'CEA' ? 'Blue' : 'Yellow';
        const puffDir = tetheredPuff.location;
        if (puffDir === undefined)
          return output.default!();

        const puffLocs = dirCards.includes(puffDir) ? 'Cardinal' : 'Intercard';
        const baitOutput: string = silkieStatus + puffEffect + puffLocs + 'Puff';
        const safeOutput: string = silkieStatus + 'Puffs' + puffLocs + 'SafeLater';

        // set the output for the subsequent safe call here and pass the output to the followup trigger
        // this keeps all of the interrelated output strings in this trigger for ease of customization
        data.freshPuff2SafeAlert = output[safeOutput]!();
        return output.bait!({
          boss: output[silkieStatus]!(),
          dir: output[puffDir]!(),
          puff: output[baitOutput]!(),
        });
      },
      outputStrings: {
        N: Outputs.arrowN,
        E: Outputs.arrowE,
        S: Outputs.arrowS,
        W: Outputs.arrowW,
        NW: Outputs.arrowNW,
        NE: Outputs.arrowNE,
        SE: Outputs.arrowSE,
        SW: Outputs.arrowSW,
        bait: {
          en: '보스${boss}, 처리: ${dir} ${puff}',
        },
        bossIce: {
          en: '🔵',
        },
        bossIcePuffsCardinalSafeLater: {
          en: '비스듬 안전 (대부분 🟡앞)',
        },
        bossIcePuffsIntercardSafeLater: {
          en: '비스듬 안전 (대부분 🟡앞)',
        },
        bossWind: {
          en: '🟡',
        },
        bossWindPuffsCardinalSafeLater: {
          en: '한가운데가 안전',
        },
        bossWindPuffsIntercardSafeLater: {
          en: '한가운데가 안전',
        },
        // keep tethered puff info as separate outputStrings
        // so users can customize for their particular strat
        bossIceBlueCardinalPuff: {
          en: '🔵파랑 솜털',
        },
        bossIceBlueIntercardPuff: {
          en: '🔵파랑 솜털',
        },
        bossIceYellowCardinalPuff: {
          en: '🟡노란솜털',
        },
        bossIceYellowIntercardPuff: {
          en: '🟡노란솜털',
        },
        bossWindBlueCardinalPuff: {
          en: '🔵파랑 솜털',
        },
        bossWindBlueIntercardPuff: {
          en: '🔵파랑 솜털',
        },
        bossWindYellowCardinalPuff: {
          en: '🟡노란솜털',
        },
        bossWindYellowIntercardPuff: {
          en: '🟡노란솜털',
        },
        default: {
          en: '솜털 땡겨요~',
        },
      },
    },
    {
      id: 'ASSS Fresh Puff 2 Safe',
      type: 'Tether',
      netRegex: { source: 'Silken Puff' },
      condition: (data, matches) => matches.target === data.me && data.puffCounter === 2,
      delaySeconds: 6.5, // wait for bait alert to no longer display
      alertText: (data, _matches, output) => {
        if (data.freshPuff2SafeAlert !== undefined)
          return output.safe!({ safe: data.freshPuff2SafeAlert });
        return;
      },
      outputStrings: {
        safe: {
          en: '${safe}',
        },
      },
    },
    {
      id: 'ASSS Brim Over',
      type: 'Ability',
      netRegex: { id: '776E', source: 'Eastern Ewer', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.avoidEwers!(),
      outputStrings: {
        avoidEwers: {
          en: '항아리 피해요',
        },
      },
    },
    {
      // For Fresh Puff 3, there are eight Silken Puffs in two rows.  Six are then "rinsed" by Eastern Ewers.
      // After suds effects are applied to all eight Silken Puffs, Silkie uses 'Eastern Ewers' (7790),
      // followed by three (existing) Eastern Ewer combatants using 'Brim Over' (7791).
      // ~1.6 seconds later, 3 new 'Eastern Ewer' combatants are added, who begin using 'Rinse' (7792).
      // They repeat using the Rinse ability about ~0.85 seconds as they move N->S through the arena.
      // On three of those recasts, they target the ability on Silken Puffs in their column (same ability ID, 7792):
      // 1st targets the N-most Puff; 2nd targets both Puffs in the column (separate 21 lines for each Puff); and 3rd targets just the S Puff.
      // As each Puff is targeted by a Rinse ability, it loses its Suds effect.
      // This trigger fires off of the first targeted use of 'Rinse'.
      id: 'ASSS Fresh Puff 3',
      type: 'Ability',
      netRegex: { id: '7792', source: 'Eastern Ewer', target: 'Silken Puff', capture: false },
      delaySeconds: 1.1, // wait for the Ewers to 'rinse' the six puffs, leaving 2 with status effects
      durationSeconds: 6, // leave alert up while Ewers finish rinsing until Puffs detonate
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (Object.keys(data.silkenPuffs).length !== 2)
          return output.default!();

        const puffEffects: string[] = [];
        for (const puff of Object.values(data.silkenPuffs)) {
          if (puff.effect !== undefined)
            puffEffects.push(puff.effect);
        }

        const [puff0, puff1] = puffEffects.sort(); // sort to simplify switch statement later
        if (puff0 === undefined || puff1 === undefined)
          return output.default!();

        // See Silken Puff Suds Gain trigger for list of Silken Puff effectIds
        switch (puff0) {
          case 'CE9':
            if (puff1 === 'CEB')
              return output.windAndLightning!();
            return output.default!(); // should not ever have double-donut, or donut-ice combo
          case 'CEA':
            if (puff1 === 'CEA') {
              return output.doubleIce!();
            } else if (puff1 === 'CEB') {
              return output.iceAndLightning!();
            }
            return output.default!();
          case 'CEB':
            if (puff1 === 'CEB')
              return output.doubleLightning!();
            return output.default!();
          default:
            return output.default!();
        }
      },
      outputStrings: {
        windAndLightning: {
          en: '🟢바로 밑으로',
        },
        doubleIce: {
          en: '비스듬히, 솜털 피해요',
        },
        iceAndLightning: {
          en: '🟡옆으로',
        },
        doubleLightning: {
          en: '솜털 사이로',
        },
        default: {
          en: '솜털 장판 피해요',
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
      id: 'ASSS King\'s Will',
      type: 'StartsUsing',
      netRegex: { id: '7980', source: 'Sil\'dihn Dullahan', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자기 강화',
          ja: '自己強化',
        },
      },
    },
    {
      id: 'ASSS Hells\' Nebula',
      type: 'StartsUsing',
      netRegex: { id: '7984', source: 'Sil\'dihn Armor', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '체력이 1이네!',
          ja: '体力１!',
        },
      },
    },
    {
      id: 'ASSS Infernal Weight',
      type: 'StartsUsing',
      netRegex: { id: '7983', source: 'Sil\'dihn Armor', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '헤비, 발 밑으로',
          de: 'AoE + Rein',
          ja: 'ヘビィ, 足元へ',
        },
      },
    },
    {
      id: 'ASSS Dominion Slash',
      type: 'StartsUsing',
      netRegex: { id: '7982', source: 'Sil\'dihn Armor', capture: false },
      response: Responses.getBehind(),
    },
    // ---------------- Gladiator of Sil'dih ----------------
    {
      id: 'ASSS Flash of Steel',
      type: 'StartsUsing',
      netRegex: { id: '77B3', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.aoe(),
    },
    /* 안씀
    {
      id: 'ASSS Rush of Might 1',
      // Boss casts 779E (12.2s) and 779D (10.2s), twice
      // Gladiator of Mirage casts 779B, 779A, 779C, these target the environment
      // North
      //                East               West
      //   Line 1: (-34.14, -270.14) (-35.86, -270.14)
      //   Line 2: (-39.45, -275.45) (-30.55, -275.45)
      //   Line 3: (-44.75, -280.75) (-25.25, -280.75)
      // South
      //                East               West
      //   Line 1: (-34.14, -271.86) (-35.86, -271.86)
      //   Line 2: (-39.45, -266.55) (-30.55, -266.55)
      //   Line 3: (-44.75, -261.25) (-25.25, -261.25)
      // Center is at (-35, -271)
      type: 'StartsUsing',
      netRegex: { id: '779E', source: 'Gladiator of Sil\'dih' },
      delaySeconds: 0.4,
      promise: async (data, matches) => {
        if (data.mightCasts.length === 2)
          data.mightCasts = [];

        // select the Gladiator with same source id
        let gladiatorData = null;
        gladiatorData = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        });

        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (gladiatorData === null) {
          console.error(`Gladiator of Sil'dih: null data`);
          return;
        }
        if (gladiatorData.combatants.length !== 1) {
          console.error(`Gladiator of Sil'dih: expected 1, got ${gladiatorData.combatants.length}`);
          return;
        }

        const gladiator = gladiatorData.combatants[0];
        if (!gladiator)
          return;
        data.mightCasts.push(gladiator);
      },
      infoText: (data, _matches, output) => {
        if (data.mightCasts.length !== 2)
          return;
        const mirage1 = data.mightCasts[0];
        const mirage2 = data.mightCasts[1];

        if (mirage1 === undefined || mirage2 === undefined)
          throw new UnreachableCode();

        const x1 = mirage1.PosX;
        const y1 = mirage1.PosY;
        const x2 = mirage2.PosX;
        const y2 = mirage2.PosY;

        const getLine = (x: number) => {
          // Round values to be easier to read:
          //   1    2    3
          // [-35, -40, -45]
          // [-35, -30, -25]
          const roundX = Math.round(x / 5) * 5;
          if (roundX === -45 || roundX === -25)
            return 3;
          else if (roundX === -40 || roundX === -30)
            return 2;
          else if (roundX === -35)
            return 1;
          return undefined;
        };
        const line1 = getLine(x1);
        const line2 = getLine(x2);
        if (line1 === undefined || line2 === undefined) {
          console.error(`Rush of Might 1: Failed to determine line from ${x1} or ${x2}`);
          return;
        }

        const line = line1 > line2 ? line1 : line2;

        // Get card and greatest relative x value
        let card;
        const roundY = Math.round(y1 / 3) * 3;
        // Round values to be easier to read:
        //          1     2     3
        // North [-270, -276, -282]
        // South [-273, -267, -261]
        if (roundY === -270 || roundY === -276 || roundY === -282) {
          // Get the x value of farthest north mirage
          const x = y1 < y2 ? x1 : x2;
          card = x < -35 ? 'west' : 'east';
          data.mightDir = 'north';
        } else if (roundY === -273 || roundY === -267 || roundY === -261) {
          // Get the x value of farthest south mirage
          const x = y1 > y2 ? x1 : x2;
          card = x < -35 ? 'west' : 'east';
          data.mightDir = 'south';
        } else {
          console.error(`Rush of Might 1: Failed to determine card from ${y1}`);
          return;
        }

        // When one is 2 and one is 3 we need to be inside (towards middle)
        if (line1 === 2 && line2 === 3 || line1 === 3 && line2 === 2)
          return output.insideLine!({ card: output[card]!() });
        return output.outsideLine!({ card: output[card]!(), line: line });
      },
      outputStrings: {
        outsideLine: {
          en: 'Outside ${card}, above line ${line}',
          ko: '${card} 바깥, ${line}번 줄 위로',
        },
        insideLine: {
          en: 'Inside ${card}, above line 3',
          ko: '${card} 안, 3번 줄 위로',
        },
        east: Outputs.east,
        west: Outputs.west,
      },
    },
    {
      id: 'ASSS Rush of Might 2',
      type: 'Ability',
      netRegex: { id: '779D', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.mightDir === undefined)
          return output.move!();
        return output.text!({ dir: output[data.mightDir]!() });
      },
      outputStrings: {
        text: {
          en: 'Move ${dir}',
          ko: '${dir}으로',
        },
        north: Outputs.north,
        south: Outputs.south,
        move: Outputs.moveAway,
      },
    },
    */
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
          ko: '"${player}" 돌진 대상',
        },
        chargeOnYou: {
          en: '내게 돌진!',
          de: 'Ansturm auf DIR',
          fr: 'Charge sur VOUS',
          ja: '自分に突進！',
          cn: '蓝球点名',
          ko: '돌진 대상자',
        },
      },
    },
    {
      id: 'ASSS Mighty Smite',
      type: 'StartsUsing',
      netRegex: { id: '77B4', source: 'Gladiator of Sil\'dih' },
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
          en: '뭉쳤다 => 흩어져요 (${player})',
          de: 'Auf ${player} sammeln => Verteilen',
          ja: '頭割り => 散会 (${player})',
          ko: '${player} 쉐어 => 산개',
        },
        stackOnYouThenSpread: {
          en: '내게 뭉쳤다 => 흩어져요',
          de: 'Auf DIR sammeln => Verteilen',
          ja: '自分に頭割り => 散会',
          ko: '나에게 쉐어 => 산개',
        },
        spreadThenStack: Outputs.spreadThenStack,
        spreadThenStackOn: {
          en: '흩어졌다 => 뭉쳐요 (${player})',
          de: 'Verteilen => Auf ${player} sammeln',
          ja: '散会 => 頭割り (${player})',
          ko: '산개 => ${player} 쉐어',
        },
        spreadThenStackOnYou: {
          en: '흩어졌다 => 내게 뭉쳐요',
          de: 'Verteilen => Auf DIR sammeln',
          ja: '散会 => 自分に頭割り',
          ko: '산개 => 나에게 쉐어',
        },
        spreadThenSpread: {
          en: '내가 링거, 홀로 있어야 해요',
          de: 'Verteilen => Sammeln',
          ja: '自分に連呪、ひとりぼっちでずっと',
          ko: '산개 => 쉐어',
        },
      },
    },
    {
      id: 'ASSS Ring of Might',
      // There are 6 spells:
      //   Ring 1: 779F (9.7s) / 77A2 (11.7s)
      //   Ring 2: 77A0 (9.7s) / 77A3 (11.7s)
      //   Ring 3: 77A1 (9.7s) / 77A4 (11.7s)
      // Only tracking the 11.7s spell
      type: 'StartsUsing',
      netRegex: { id: '77A[2-4]', source: 'Gladiator of Sil\'dih' },
      infoText: (_data, matches, output) => {
        if (matches.id === '77A2')
          return output.outsideInner!();
        if (matches.id === '77A3')
          return output.outsideMiddle!();
        return output.outsideOuter!();
      },
      outputStrings: {
        outsideInner: {
          en: '링 차지 ①',
          de: 'Außerhalb des inneren Ringes',
          ja: 'リングチャージ ①',
          ko: '안쪽 고리 바깥',
        },
        outsideMiddle: {
          en: '링 차지 ②',
          de: 'Außerhalb des mittleren Ringes',
          ja: 'リングチャージ ②',
          ko: '중간 고리 바깥',
        },
        outsideOuter: {
          en: '링 차지 ③',
          de: 'Außerhalb des äußeren Ringes',
          ja: 'リングチャージ ③',
          ko: '바깥쪽 고리 바깥',
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
    /* 안씀
    {
      id: 'ASSS Nothing beside Remains',
      type: 'StartsUsing',
      netRegex: { id: '77BC', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    */
    /* 안씀 → ASS+ Gilded/Silvered Fate
    {
      id: 'ASSS Accursed Visage Collect',
      // CDF = Gilded Fate
      // CE0 = Silvered Fate
      type: 'GainsEffect',
      netRegex: { effectId: ['CDF', 'CE0'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const id = matches.effectId;
        if (id === 'CDF')
          ++data.gildedCounter;
        else if (id === 'CE0')
          ++data.silveredCounter;
      },
    },
    {
      id: 'ASSS Golden/Silver Flame',
      // 77B1 = Golden Flame
      // 77B2 = Silver Flame
      type: 'StartsUsing',
      netRegex: { id: '77B[12]', source: 'Hateful Visage', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.gildedCounter > 0) {
          if (data.silveredCounter > 0)
            return output.bothFates!();
          return output.gildedFate!();
        }
        if (data.silveredCounter > 0)
          return output.silveredFate!();
        return output.neitherFate!();
      },
      outputStrings: {
        bothFates: {
          en: 'Get hit by silver and gold',
          de: 'Von Silber und Gold treffen lassen',
        },
        gildedFate: {
          en: 'Get hit by two silver',
          de: 'Von 2 Silber treffen lassen',
        },
        silveredFate: {
          en: 'Get hit by two gold',
          de: 'Von 2 Gold treffen lassen',
        },
        neitherFate: {
          en: 'Avoid silver and gold',
          de: 'Vermeide Silber und Gold',
        },
      },
    },
    */
    // 그라디아토르: Gilded/Silvered Fate
    {
      id: 'ASS+ Gilded/Silvered Fate',
      type: 'GainsEffect',
      netRegex: { effectId: ['CDF', 'CE0'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 8,
      infoText: (data, matches, output) => {
        if (data.fateSeen)
          return;
        data.fateSeen = true;
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
    {
      id: 'ASSS Sundered Remains',
      // Using 77A8 Curse of the Monument
      type: 'StartsUsing',
      netRegex: { id: '77A8', source: 'Gladiator of Sil\'dih', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' || data.CanFeint())
          return output.east!();
        else if (data.role === 'healer' || data.CanAddle() || data.CanSilence())
          return output.west!();
        return output.center!();
      },
      run: (data) => {
        data.explosionTime = 0;
        data.explosionCounter = 0;
      },
      outputStrings: {
        east: Outputs.right,
        west: Outputs.left,
        center: Outputs.goIntoMiddle,
      },
    },
    {
      id: 'ASSS Curse of the Monument',
      type: 'Ability',
      netRegex: { id: '77A8', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.breakChains(),
    },
    {
      id: 'ASSS Scream of the Fallen',
      // CDB = Scream of the Fallen (defamation)
      // BBC = First in Line
      // BBD = Second in Line
      // First/Second in Line are only used once all dungeon so we can just trigger off of them
      type: 'GainsEffect',
      netRegex: { effectId: 'BB[CD]' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        const id = matches.effectId;
        if (id === 'BBD')
          return output.soakThenSpread!();
        return output.spreadThenSoak!();
      },
      outputStrings: {
        soakThenSpread: {
          en: '타워 들어갔다 => 벽으로 가요',
          de: 'Türme zuerst nehmen => verteilen',
          ko: '첫번째 기둥 밟기 => 산개',
        },
        spreadThenSoak: {
          en: '벽으로 갔다 => 타워로 들어가요',
          de: 'Verteilen => zweite Türme nehmen',
          ko: '산개 => 두번째 기둥 밟기',
        },
      },
    },
    // 그라디아토르: Specter of Might
    {
      id: 'ASSS+ Specter of Might',
      type: 'StartsUsing',
      netRegex: { id: '77B5', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => {
        data.rushCounter++;
        data.rushVecs = [];
      },
    },
    // 그라디아토르: Rush of Might
    {
      id: 'ASSS+ Rush of Might',
      type: 'StartsUsing',
      netRegex: { id: ['779A', '779B', '779C'], source: 'Gladiator Mirage' },
      durationSeconds: 9.4,
      infoText: (data, matches, output) => {
        const i2n: { [id: string]: number } = {
          '779A': 1,
          '779B': 2,
          '779C': 3,
        };

        data.rushVecs.push({
          x: parseInt(matches.x),
          y: parseInt(matches.y),
          l: i2n[matches.id] ?? 0
        });
        if (data.rushVecs.length !== 2)
          return;

        // 가로: -20, -50
        // 세로: -256, -286
        let r1;
        let r2;
        for (const v of data.rushVecs) {
          if (v === undefined)
            return output.unknown!();

          if (v.y > -270) { // 북쪽
            if (v.x < -35) // 서쪽
              r2 = v.l;
            else
              r1 = v.l;
          } else {
            if (v.x < -35)
              r1 = v.l;
            else
              r2 = v.l;
          }
        }

        if (r1 === undefined || r2 === undefined)
          return output.unknown!();

        const c1 = output['r' + r1.toString()]!();
        const c2 = output['r' + (r2 + 3).toString()]!();
        if (data.rushCounter % 2 === 0)
          return output.revs!({ left: c1, right: c2 });
        return output.rush!({ left: c1, right: c2 });
      },
      outputStrings: {
        rush: {
          en: '${left} + ${right}',
          ja: '${left} + ${right}',
        },
        revs: {
          en: '${left} + ${right} 💫',
          ja: '${left} + ${right} 💫',
        },
        r1: {
          en: '❱',
          ja: '❱',
        },
        r2: {
          en: '❱❱',
          ja: '❱❱',
        },
        r3: {
          en: '❱❱❱',
          ja: '❱❱❱',
        },
        r4: {
          en: '❰',
          ja: '❰',
        },
        r5: {
          en: '❰❰',
          ja: '❰❰',
        },
        r6: {
          en: '❰❰❰',
          ja: '❰❰❰',
        },
        unknown: Outputs.unknown,
      },
    },
    /*
    //
    {
      id: 'AS+ 그라디아토르 Scream of the Fallen',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDB' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 12.5,
      infoText: (data, matches, output) => {
        data.explosionTime = parseInt(matches.duration); // 19초와 23초
        return data.explosionTime === 19 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: {
          en: '먼저 폭파',
          ja: '先に爆発',
        },
        tower: {
          en: '먼저 타워',
          ja: '先に塔',
        },
      },
    },
    // 그라디아토르: Explosion(766A)
    // Colossal Wreck(7669)도 여기서 표시
    {
      id: 'AS+ 그라디아토르 Explosion',
      type: 'StartsUsing',
      netRegex: { id: '766A', source: 'Gladiator of Sil\'dih' },
      preRun: (data) => data.explosionCounter++,
      infoText: (data, _matches, output) => {
        if (data.explosionCounter === 1)
          return data.explosionTime === 19 ? output.boom!() : output.tower!();
        else if (data.explosionCounter === 3)
          return data.explosionTime === 23 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: {
          en: '벽쪽에 붙어 폭파시켜요',
          ja: '外側で爆発',
        },
        tower: {
          en: '타워 밟아요',
          ja: '塔踏み',
        },
      },
    },
    */
    // ---------------- Shadowcaster Zeless Gah ----------------
    {
      id: 'ASSS Show of Strength',
      type: 'StartsUsing',
      netRegex: { id: '76C5', source: 'Shadowcaster Zeless Gah', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ASSS Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: { id: '76C4', source: 'Shadowcaster Zeless Gah' },
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
          ja: '回る杖',
        },
        p2: {
          en: '② 마법진 컷팅식',
          ja: '魔法陣',
        },
        p3: {
          en: '③ 전이 기둥과 놀아요',
          ja: '転移と遊びましょう',
        },
        p4: {
          en: '④ 카드 전이 놀이',
          ja: 'カード転移',
        },
        p5: {
          en: '⑤ 줄끊고 부채 유도',
          ja: '線切と扇誘導',
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
      //   1C2 - 1C5, Orange 1 - 4
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
      condition: (data, matches) => data.me === matches.target && data.brandCounter === 2,
      delaySeconds: 0.2, // Delay to collect all Infern Brand Effects
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

        // Store for later trigger
        data.myFlame = myNum;

        if (Object.keys(data.brandEffects).length !== 8) {
          // Missing Infern Brands, output number
          if (data.arcaneFontCounter === 3)
            return output.blueBrandNum!({ num: myNum });
          if (data.arcaneFontCounter === 2)
            return output.orangeBrandNum!({ num: myNum });
          return output.brandNum!({ num: myNum });
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
          0: 'south',
          1: 'south',
          2: 'north',
          3: 'north',
          4: 'east',
          5: 'east',
          6: 'west',
          7: 'west',
        };

        const cardX = indexToCardinal[x];
        const cardY = indexToCardinal[y];

        // Not able to be undefined as values determined from array that only has 8 indices
        if (cardX === undefined || cardY === undefined)
          throw new UnreachableCode();

        // Check color of brand that will be cut
        if (data.arcaneFontCounter === 3)
          return output.blueBrandNumCorner!({ num: myNum, corner: output[cardX + cardY]!() });
        if (data.arcaneFontCounter === 2)
          return output.orangeBrandNumCorner!({ num: myNum, corner: output[cardX + cardY]!() });
        return output.brandNumCorner!({ num: myNum, corner: output[cardX + cardY]!() });
      },
      run: (data) => data.brandEffects = {},
      outputStrings: {
        blueBrandNumCorner: {
          en: '파랑🟦 ${num}번: ${corner}',
          ko: '파란색 선 ${num}: ${corner} 구석',
        },
        orangeBrandNumCorner: {
          en: '빨강🟥 ${num}번: ${corner}',
          ko: '주황색 선 ${num}: ${corner} 구석',
        },
        brandNumCorner: {
          en: '내가 ${num}번: ${corner}',
          de: 'Kryptogramm ${num}: ${corner} Ecke',
          ko: '선 ${num}: ${corner} 구석',
        },
        blueBrandNum: {
          en: '컷팅: 파랑🟦 ${num}번',
          ko: '파란색 선 ${num}',
        },
        orangeBrandNum: {
          en: '컷팅: 빨강🟥 ${num}번',
          ko: '주황색 선 ${num}',
        },
        brandNum: {
          en: '컷팅: ${num}번',
          de: 'Kryptogramm ${num}',
          ko: '선 ${num}',
        },
        northwest: Outputs.arrowNW,
        northeast: Outputs.arrowNE,
        southeast: Outputs.arrowSE,
        southwest: Outputs.arrowSW,
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
          en: '컷팅: 파랑🟦 1번',
          de: 'Blau 1 durchtrennen',
          ko: '파란색 1 끊기',
        },
        cutOrangeOne: {
          en: '컷팅: 빨강🟥 1번',
          de: 'Orange 1 durchtrennen',
          ko: '주황색 1 끊기',
        },
        firstCut: {
          en: '컷팅하세요',
          de: 'Als Erster durchtrennen',
          ko: '첫번째 선 끊기',
        },
      },
    },
    {
      id: 'ASSS Infern Brand 2 Remaining Flames',
      // Player receives Magic Vulnerability Up from Cryptic Flame for 7.96s after cutting
      // Trigger will delay for this Magic Vulnerability Up for safety
      // No exception for time remaining on debuff to sacrafice to cut the line
      type: 'LosesEffect',
      netRegex: { effectId: '95D', target: 'Infern Brand', count: '1C[2-9]' },
      condition: (data, matches) => {
        if (data.myFlame !== undefined && data.brandCounter === 2) {
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

          // Check which flame order this is
          const flameCut = countToNum[matches.count];
          if (flameCut === undefined)
            return false;

          // Wraparound and add 1 as we need next flame to cut
          // Check if not our turn to cut
          if (flameCut % 4 + 1 !== data.myFlame)
            return false;

          return true;
        }
        return false;
      },
      delaySeconds: (data, matches) => {
        if (data.myLastCut === undefined)
          return 0;

        // Check if we still need to delay for Magic Vulnerability Up to expire
        // Magic Vulnerability Up lasts 7.96 from last cut
        const delay = 7.96 - (Date.parse(matches.timestamp) - data.myLastCut) / 1000;
        if (delay > 0)
          return delay;
        return 0;
      },
      alertText: (data, matches, output) => {
        if (data.arcaneFontCounter === 3 && matches.count.match(/1C[6-8]/)) {
          // Expected Blue and count is Blue
          data.arcaneFontCounter = 2;
          return output.cutBlueNum!({ num: data.myFlame });
        }
        if (data.arcaneFontCounter === 2 && matches.count.match(/1C[2-4]/)) {
          // Expected Orange and count is Orange
          data.arcaneFontCounter = 3;
          return output.cutOrangeNum!({ num: data.myFlame });
        }

        // Exception for First Flame on second set
        if (data.myFlame === 1) {
          if (data.arcaneFontCounter === 3 && matches.count === '1C5')
            return output.cutBlueNum!({ num: data.myFlame });
          if (data.arcaneFontCounter === 2 && matches.count === '1C9')
            return output.cutOrangeNum!({ num: data.myFlame });
        }
        // Unexpected result, mechanic is likely failed at this point
      },
      run: (data) => data.brandEffects = {},
      outputStrings: {
        cutOrangeNum: {
          en: '컷팅: 빨강🟥 ${num}번',
          de: 'Orange ${num} durchtrennen',
          ko: '주황색 ${num} 끊기',
        },
        cutBlueNum: {
          en: '컷팅: 파랑🟦 ${num}번',
          de: 'Blau ${num} durchtrennen',
          ko: '파란색 ${num} 끊기',
        },
      },
    },
    {
      id: 'ASSS Infern Brand Cryptic Flame Collect',
      // Collect timestamp for when last cut flame
      type: 'Ability',
      netRegex: { id: '76CA', source: 'Infern Brand' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.myLastCut = Date.parse(matches.timestamp),
    },
    {
      id: 'ASSS Banishment',
      // Players receive invisible effect that indicates rotation and direction
      // of their teleport attached teleport pad
      //
      // At the same time, two teleports on North and South are also marked:
      // one rotates outside the arena, the other rotates towards the inner rows
      // Players have 12s to teleport using the safe teleports prior to Call of
      // the Portal (CCC) expiration
      //
      // The first teleports occur at ~11.4s after these debuff go out
      // After first teleport, lasers block rows but can be teleported over
      // Hitting a laser results in stun and likely death
      //
      // Seconds after first teleport, two wards will go off that target the
      // two nearest players. Players need to have teleported close enough
      // to the ward to bait the ward away from other players
      //
      // Following the first set of baits, the player's teleport will go off
      // which should have been positioned to teleport across the laser to bait
      // the final ward away from other players
      //
      // 1CD Blue (Counterclockwise) Teleporting East
      // 1CE Orange (Clockwise) Teleporting West
      // 1D2 Orange (Clockwise) Teleporting East
      // 1D3 Blue (Counterclockwise) Teleporting West
      //
      // There are multiple strategies, so this only describes what you have,
      // from there you can create a personal call of where to go
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, matches, output) => {
        switch (matches.count) {
          case '1CD':
            return output.blueEast!();
          case '1CE':
            return output.orangeWest!();
          case '1D2':
            return output.orangeEast!();
          case '1D3':
            return output.blueWest!();
        }
      },
      outputStrings: {
        blueEast: {
          en: '셋째줄 🡺',
          ja: '3列 🡺',
          ko: '파란색 동쪽 텔레포트',
        },
        blueWest: {
          en: '🡸 맨아랫줄',
          ja: '🡸 一番下列',
          ko: '파란색 서쪽 텔레포트',
        },
        orangeEast: {
          en: '둘째줄 🡺',
          ja: '2列 🡺',
          ko: '주황색 동쪽 텔레포트',
        },
        orangeWest: {
          en: '🡸 첫째줄',
          ja: '🡸 1列',
          ko: '주황색 서쪽 텔레포트',
        },
      },
    },
    /* 아래는 안씀
    {
      id: 'ASSS Banishment First Ward',
      // This debuff expires 4.7s before the first bait, but there is a slight
      // animation lock from the teleport that occurs
      // Repositioning may be required to bait the active ward's Infern Wave
      // Using Call of the Portal (CCC) expiration for trigger
      type: 'LosesEffect',
      netRegex: { effectId: 'CCC' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.75, // Delay for animation lock from teleport to complete
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait First Ward',
        },
      },
    },
    {
      id: 'ASSS Banishment Bait Second Ward',
      // After the second teleport and stun expiring, there is 2s before the
      // the last ward casts Infern Wave that must be baited
      // Rite of Passage (CCD) debuff is tied to the player's teleport going
      // off
      type: 'LosesEffect',
      netRegex: { effectId: 'CCD' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 2, // Delay for stun to complete
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Second Ward',
        },
      },
    },
    */
    {
      id: 'ASSS Infern Brand 5 Starting Position',
      // CC4 First Brand
      // CC5 Second Brand
      // CC6 Third Brand
      // CC7 Fourth Brand
      // Although we can see where the 4 wards spawn, Does not seem to be a way
      // to determine which one is animated which is required to tell which color
      // to cut
      type: 'GainsEffect',
      netRegex: { effectId: ['CC4', 'CC5', 'CC6', 'CC7'] },
      condition: (data, matches) => data.me === matches.target && data.brandCounter === 5,
      delaySeconds: 0.1,
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

        // Store for later trigger
        data.myFlame = myNum;

        // In Infern Brand 5, there are 4 wards in a + and blocked by 2 lines each
        // This creates an opening in middle where First Brand + Second Brand
        // while Third Brand and Fourth Brand need to bait the first ward
        // Blue N/S:
        //   (304.00, -110.00)
        //   (304.00, -108.00)
        //
        //   (304.00, -102.00)
        //   (304.00, -100.00)
        // Orange E/W:
        //   (284.00, -85.00)
        //   (286.00, -85.00)
        //
        //   (292.00, -85.00)
        //   (294.00, -85.00)

        // Generic output unless we find a method to determine which way to cut
        if (myNum === 1 || myNum === 2)
          return output.middle!({ num: myNum });
        return output.outThenBait!({ num: myNum });
      },
      run: (data) => data.brandEffects = {},
      outputStrings: {
        middle: {
          en: '내가 ${num}번: ⊙한가운데로',
          ko: '선 ${num}: 중앙으로',
        },
        outThenBait: {
          en: '내가 ${num}번: ☥기둥으로',
          ko: '선 ${num}: 밖으로, 지팡이 유도',
        },
      },
    },
    {
      id: 'ASSS Infern Brand 5 First Flame',
      // CC8 First Flame
      // CC9 Second Flame
      // CCA Third Flame
      // CCB Fourth Flame
      // Until we find a way to determine color, call cut order only
      type: 'GainsEffect',
      netRegex: { effectId: 'CC8' },
      condition: (data, matches) => data.me === matches.target && data.brandCounter === 5,
      alertText: (_data, _matches, output) => output.firstCut!(),
      outputStrings: {
        firstCut: {
          en: '컷팅하세요',
          de: 'Als Erster durchtrennen',
          ko: '첫번째 선 끊기',
        },
      },
    },
    {
      id: 'ASSS Infern Brand 5 Infern Wave Counter',
      type: 'Ability',
      netRegex: { id: '76CD', source: 'Infern Brand', capture: false },
      condition: (data) => data.brandCounter === 5,
      preRun: (data) => data.waveCounter++,
      suppressSeconds: 1,
    },
    {
      id: 'ASSS Infern Brand 5 Cuts after Baits',
      // Utilizing 1.96s Magic Vulnerability Up (B7D) from Infern Wave to tell
      // when to start cutting after baiting the Infern Ward
      // Vulnerability expires after Pure Fire (749F) puddles, so no need to
      // add additional delay for the puddle
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D' },
      condition: (data, matches) => {
        const duration = parseFloat(matches.duration);
        return data.me === matches.target && data.brandCounter === 5 && duration <= 2;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cutOrangeNum: {
            en: '컷팅: 빨강🟥 ${num}번',
            de: 'Orange ${num} durchtrennen',
            ko: '주황색 ${num} 끊기',
          },
          cutBlueNum: {
            en: '컷팅: 파랑🟦 ${num}번',
            de: 'Blau ${num} durchtrennen',
            ko: '파란색 ${num} 끊기',
          },
          moveOrange: {
            en: '컷팅준비: 빨강🟥 ${num}번',
            ko: '주황색 ${num} 끊을 준비',
          },
          moveBlue: {
            en: '컷팅준비: 파랑🟦 ${num}번',
            ko: '파란색 ${num} 끊을 준비',
          },
        };

        // Check for race condition with Second Flame after first bait
        // or that it is the third bait that has no race
        if (data.waveCounter === 1 && data.flamesCutCounter === 1 || data.waveCounter === 3) {
          // Third and Fourth Flames need to move to cut across immediately after baiting
          // Three can cut their flame if they have baited and 2 has cut
          if (data.myFlame === 3) {
            if (data.firstColorCut === 'blue')
              return { alertText: output.cutBlueNum!({ num: data.myFlame }) };
            return { alertText: output.cutOrangeNum!({ num: data.myFlame }) };
          }
          if (data.myFlame === 4) {
            if (data.firstColorCut === 'blue')
              return { infoText: output.moveBlue!({ num: data.myFlame }) };
            return { infoText: output.moveOrange!({ num: data.myFlame }) };
          }
        }

        // First Flame needs to cut after the second bait
        if (data.waveCounter === 2 && data.myFlame === 1) {
          if (data.firstColorCut === 'orange')
            return { alertText: output.cutOrangeNum!({ num: data.myFlame }) };
          return { alertText: output.cutBlueNum!({ num: data.myFlame }) };
        }
      },
    },
    {
      id: 'ASSS Infern Brand 5 Remaining Flames',
      type: 'LosesEffect',
      netRegex: { effectId: '95D', target: 'Infern Brand', count: '1C[2-9]' },
      condition: (data) => data.brandCounter === 5,
      preRun: (data, matches) => {
        data.flamesCutCounter++;
        // First and last of a set let us know what's being cut next
        if (data.flamesCutCounter === 1) {
          if (matches.count === '1C2')
            data.firstColorCut = 'orange';
          else if (matches.count === '1C5')
            data.firstColorCut = 'blue';
        } else if (data.flamesCutCounter === 4) {
          data.firstColorCut = data.firstColorCut === 'orange' ? 'blue' : 'orange';
        }
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitWardTwo: {
            en: '둘째 기둥으로 => 장판 깔아요',
            ko: '지팡이 2 유도 => 장판 유도',
          },
          baitWardThree: {
            en: '셋째 기둥으로',
            ko: '지팡이 3 유도',
          },
          baitPuddles: {
            en: '장판 깔아요',
            ko: '장판 유도',
          },
          cutOrangeNum: {
            en: '컷팅: 빨강🟥 ${num}번',
            de: 'Orange ${num} durchtrennen',
            ko: '주황색 ${num} 끊기',
          },
          cutBlueNum: {
            en: '컷팅: 파랑🟦 ${num}번',
            de: 'Blau ${num} durchtrennen',
            ko: '파란색 ${num} 끊기',
          },
          moveOrangeNum: {
            en: '컷팅준비: 빨강🟥 ${num}번',
            ko: '주황색 ${num} 끊을 준비',
          },
          moveBlueNum: {
            en: '컷팅준비: 파랑🟦 ${num}번',
            ko: '파란색 ${num} 끊을 준비',
          },
        };

        // Two can cut immediately after one
        if (data.myFlame === 2 && (data.flamesCutCounter === 1 || data.flamesCutCounter === 6)) {
          if (data.firstColorCut === 'blue')
            return { alertText: output.cutBlueNum!({ num: data.myFlame }) };
          return { alertText: output.cutOrangeNum!({ num: data.myFlame }) };
        }

        // Three can cut if they have baited their wave and two has cut
        if (data.myFlame === 3 && data.flamesCutCounter === 2 && data.waveCounter === 1) {
          if (data.firstColorCut === 'blue')
            return { alertText: output.cutBlueNum!({ num: data.myFlame }) };
          return { alertText: output.cutOrangeNum!({ num: data.myFlame }) };
        }
        // Four can follow three after they have baited and two has cut
        if (data.myFlame === 4 && data.flamesCutCounter === 2 && data.waveCounter === 1) {
          if (data.firstColorCut === 'blue')
            return { infoText: output.moveBlueNum!({ num: data.myFlame }) };
          return { infoText: output.moveOrangeNum!({ num: data.myFlame }) };
        }

        // Four can cut immediately after three
        if (data.myFlame === 4 && (data.flamesCutCounter === 3 || data.flamesCutCounter === 7)) {
          if (data.firstColorCut === 'blue')
            return { alertText: output.cutBlueNum!({ num: data.myFlame }) };
          return { alertText: output.cutOrangeNum!({ num: data.myFlame }) };
        }

        // Fourth Flame should open path for One and Two to bait second ward
        if (data.flamesCutCounter === 4) {
          if (data.myFlame === 1 || data.myFlame === 2)
            return { alertText: output.baitWardTwo!() };
          return { infoText: output.baitPuddles!() };
        }

        // Sixth Flame should open path for Three and Four to bait third ward
        if (data.flamesCutCounter === 6 && (data.myFlame === 3 || data.myFlame === 4))
          return { alertText: output.baitWardThree!() };
      },
    },
    /*
    //
    {
      id: 'ASSS+ 젤레스가 Cryptic Portal',
      type: 'StartsUsing',
      // 안맞을거 같은데... 고쳐야함
      netRegex: { id: '7494', source: 'Shadowcaster Zeless Gah' },
    },
    */
    //
    {
      id: 'ASSS+ Firesteel Strike',
      type: 'StartsUsing',
      // 안맞을거 같은데... 고쳐야함
      netRegex: { id: '76C5', source: 'Shadowcaster Zeless Gah' },
      response: Responses.spread(),
      run: (data) => data.firesteelStrikes = [],
    },
    //
    {
      id: 'ASSS+ Firesteel Strike Collect',
      type: 'Ability',
      netRegex: { id: ['76C6', '76C7'], source: 'Shadowcaster Zeless Gah' },
      run: (data, matches) => data.firesteelStrikes.push(matches.target),
    },
    //
    {
      id: 'ASSS+ Blessed Beacon',
      type: 'StartsUsing',
      // 안맞을거 같은데... 고쳐야함
      netRegex: { id: '76C7', source: 'Shadowcaster Zeless Gah' },
      response: (data, _matches, output) => {
        if (data.firesteelStrikes.length === 0)
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
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        '(?<!/ )Chilling Duster / Fizzling Duster': 'Chilling/Fizzling Duster',
        'Bracing Duster / Chilling Duster / Fizzling Duster': 'Duster',
        'Bracing Duster / Chilling Duster(?! )': 'Bracing/Chilling Duster',
        'Bracing Duster / Fizzling Duster': 'Bracing/Fizzling Duster',
        'Bracing Suds / Chilling Suds / Fizzling Suds': 'Suds',
        'Bracing Suds / Chilling Suds(?! )': 'Bracing/Chilling Suds',
        'Bracing Suds / Fizzling Suds': 'Bracing/Fizzling Suds',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Aqueduct Armor': 'Aquädukt-Kampfmaschine',
        'Aqueduct Belladonna': 'Aquädukt-Belladonna',
        'Aqueduct Dryad': 'Aquädukt-Dryade',
        'Aqueduct Kaluk': 'Aquädukt-Kaluk',
        'Aqueduct Udumbara': 'Aquädukt-Udumbara',
        'Arcane Font': 'arkan(?:e|er|es|en) Tafel',
        'Ball of Fire': 'Feuerball',
        'Eastern Ewer': 'Waschkrug',
        'Gladiator of Sil\'dih': 'Gladiator von Sil\'dih',
        'Hateful Visage': 'Hassendes Haupt',
        'Infern Brand': 'Infernales Mal',
        'Shadowcaster Zeless Gah': 'Schattenwirker Zeless Gah',
        'Sil\'dihn Dullahan': 'Sil\'dih-Dullahan',
        'Silkie': 'Silkie',
        'The Trial of Balance': 'Prüfung der Gerechtigkeit',
        'The Trial of Knowledge': 'Prüfung der Weisheit',
        'The Trial of Might': 'Prüfung der Macht',
      },
      'replaceText': {
        'Accursed Visage': 'Verdammtes Haupt',
        'Banishment': 'Verbannung',
        'Blazing Benifice': 'Heiliger Feuereifer',
        'Blessed Beacon': 'Himmelsfeuer',
        'Bracing Duster': 'Spritziger Wedel',
        'Bracing Suds': 'Spritziger Schaum',
        'Burn': 'Verbrennung',
        'Carpet Beater': 'Teppichklopfer',
        'Cast Shadow': 'Schattenfall',
        'Chilling Duster': 'Kalter Wedel',
        'Chilling Suds': 'Kalter Schaum',
        'Colossal Wreck': 'Riesig Trümmerbild',
        'Cryptic Flames': 'Kryptische Flammen',
        'Cryptic Portal': 'Kryptisches Portal',
        'Curse of the Fallen': 'Fluch des Zerfallenen',
        'Curse of the Monument': 'Fluch des Denkmals',
        'Dust Bluster': 'Staubbläser',
        'Eastern Ewers': 'Waschkrug',
        'Echo of the Fallen': 'Fluch des Äons',
        'Explosion': 'Explosion',
        'Firesteel Fracture': 'Feuerstahl-Brecher',
        'Firesteel Strike': 'Feuerstahl-Schlag',
        'Fizzling Duster': 'Prickelnder Wedel',
        'Fizzling Suds': 'Prickelnder Schaum',
        'Flash of Steel': 'Blitzender Stahl',
        'Fresh Puff': 'Frischer Puschel',
        'Gold Flame': 'Goldene Flamme',
        'Hateful Visage': 'Hassendes Haupt',
        'Infern Brand': 'Infernales Mal',
        'Infern Ward': 'Infernale Wehr',
        'Infern Wave': 'Infernale Welle',
        'Mighty Smite': 'Mächtiger Streich',
        'Nothing beside Remains': 'Nichts weiter blieb',
        'Puff and Tumble': 'Puschelputz',
        'Pure Fire': 'Reines Feuer',
        'Rinse': 'Spülung',
        'Rush of Might': 'Rausch der Macht',
        'Scream of the Fallen': 'Fluch der Ewigkeit',
        'Sculptor\'s Passion': 'Bildners Hohn',
        'Show of Strength': 'Kraftakt',
        'Silver Flame': 'Silberne Flamme',
        'Slippery Soap': 'Schmierige Seife',
        'Soap\'s Up': 'Einseifen',
        'Soaping Spree': 'Seifentaumel',
        'Specter of Might': 'Schemen der Macht',
        'Squeaky Clean': 'Blitzeblank',
        'Sundered Remains': 'Tote Trümmer',
        'Total Wash': 'Vollwäsche',
        'Wrath of Ruin': 'Düster Zorn',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Aqueduct Armor': 'armure maléfique des aqueducs',
        'Aqueduct Belladonna': 'belladone des aqueducs',
        'Aqueduct Dryad': 'dryade des aqueducs',
        'Aqueduct Kaluk': 'kaluk des aqueducs',
        'Aqueduct Udumbara': 'udumbara des aqueducs',
        'Arcane Font': 'sphère arcanique',
        'Ball of Fire': 'Boule de flammes',
        'Eastern Ewer': 'cruche orientale',
        'Gladiator of Sil\'dih': 'gladiateur sildien',
        'Hateful Visage': 'Visage de haine',
        'Infern Brand': 'Étendard sacré',
        'Shadowcaster Zeless Gah': 'Zeless Gah la Flamme ombrée',
        'Sil\'dihn Dullahan': 'dullahan sildien',
        'Silkie': 'Silkie',
        'The Trial of Balance': 'Épreuve de la Justice',
        'The Trial of Knowledge': 'Épreuve de la Sagesse',
        'The Trial of Might': 'Épreuve de la Puissance',
      },
      'replaceText': {
        'Accursed Visage': 'Visage d\'exécration',
        'Banishment': 'Bannissement',
        'Blazing Benifice': 'Canon des flammes sacrées',
        'Blessed Beacon': 'Flamme sacrée céleste',
        'Bracing Duster': 'Plumeau tonifiant',
        'Bracing Suds': 'Mousse tonifiante',
        'Burn': 'Combustion',
        'Carpet Beater': 'Tapette à tapis',
        'Cast Shadow': 'Ombre crépitante',
        'Chilling Duster': 'Plumeau givré',
        'Chilling Suds': 'Mousse givrée',
        'Colossal Wreck': 'Ruine colossale',
        'Cryptic Flames': 'Flammes cryptiques',
        'Cryptic Portal': 'Portail cryptique',
        'Curse of the Fallen': 'Malédiction hurlante',
        'Curse of the Monument': 'Malédiction monumentale',
        'Dust Bluster': 'Dépoussiérage',
        'Eastern Ewers': 'Aiguière aqueuse',
        'Echo of the Fallen': 'Écho déchu',
        'Explosion': 'Explosion',
        'Firesteel Fracture': 'Choc brasero',
        'Firesteel Strike': 'Frappe brasero',
        'Fizzling Duster': 'Plumeau pétillant',
        'Fizzling Suds': 'Mousse pétillante',
        'Flash of Steel': 'Éclair d\'acier',
        'Fresh Puff': 'Pompon lustré',
        'Gold Flame': 'Flamme dorée',
        'Hateful Visage': 'Visage de haine',
        'Infern Brand': 'Étendard sacré',
        'Infern Ward': 'Barrière infernale',
        'Infern Wave': 'Vague infernale',
        'Mighty Smite': 'Taillade belliqueuse',
        'Nothing beside Remains': 'Soulèvement général',
        'Puff and Tumble': 'Pompon culbuteur',
        'Pure Fire': 'Feu immaculé',
        'Rinse': 'Rinçage',
        'Rush of Might': 'Déferlement de puissance',
        'Scream of the Fallen': 'Grand écho déchu',
        'Sculptor\'s Passion': 'Canon belliqueux',
        'Show of Strength': 'Cri du guerrier',
        'Silver Flame': 'Flamme argentée',
        'Slippery Soap': 'Bain moussant glissant',
        'Soap\'s Up': 'Bain moussant explosif',
        'Soaping Spree': 'Bain moussant public',
        'Specter of Might': 'Spectre immémorial',
        'Squeaky Clean': 'Frottage',
        'Sundered Remains': 'Soulèvement belliqueux',
        'Total Wash': 'Lavage intégral',
        'Wrath of Ruin': 'Colère immémoriale',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Aqueduct Armor': 'アクアダクト・イビルアーマー',
        'Aqueduct Belladonna': 'アクアダクト・ベラドンナ',
        'Aqueduct Dryad': 'アクアダクト・ドライアド',
        'Aqueduct Kaluk': 'アクアダクト・カルク',
        'Aqueduct Udumbara': 'アクアダクト・ウドンゲ',
        'Arcane Font': '立体魔法陣',
        'Ball of Fire': '火炎球',
        'Eastern Ewer': '洗い壺',
        'Gladiator of Sil\'dih': 'シラディハ・グラディアトル',
        'Gladiator Mirage': 'ミラージュ・グラディアトル',
        'Hateful Visage': '呪像起動',
        'Infern Brand': '呪具設置',
        'Shadowcaster Zeless Gah': '影火のゼレズ・ガー',
        'Sil\'dihn Dullahan': 'シラディハ・デュラハン',
        'Silkie': 'シルキー',
        'The Trial of Balance': '参の試練',
        'The Trial of Knowledge': '壱の試練',
        'The Trial of Might': '弐の試練',
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
        'Accursed Visage': '呪怨呪像',
        'Banishment': '強制転移の呪',
        'Blazing Benifice': '聖火砲',
        'Blessed Beacon': '天の聖火',
        'Bracing Duster': 'そよそよダスター',
        'Bracing Suds': 'そよそよシャンプー',
        'Burn': '燃焼',
        'Carpet Beater': 'カーペットビーター',
        'Cast Shadow': '影火呪式',
        'Chilling Duster': 'ひえひえダスター',
        'Chilling Suds': 'ひえひえシャンプー',
        'Colossal Wreck': '亡国の霊塔',
        'Cryptic Flames': '火焔の呪印',
        'Cryptic Portal': '転移の呪印',
        'Curse of the Fallen': '呪怨の咆哮',
        'Curse of the Monument': '呪怨の連撃',
        'Dust Bluster': 'ダストブロワー',
        'Eastern Ewers': '洗い壺',
        'Echo of the Fallen': '呪怨の残響',
        'Explosion': '爆発',
        'Firesteel Fracture': '石火豪打',
        'Firesteel Strike': '石火豪衝',
        'Fizzling Duster': 'ぱちぱちダスター',
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
        'Puff and Tumble': 'ポンポンはたきがけ',
        'Pure Fire': '劫火',
        'Rinse': 'すすぎ洗い',
        'Rush of Might': '大剛の突撃',
        'Scream of the Fallen': '呪怨の大残響',
        'Sculptor\'s Passion': '闘人砲',
        'Show of Strength': '勇士の咆哮',
        'Silver Flame': '白銀の閃火',
        'Slippery Soap': 'すべってシャンプーボム',
        'Soap\'s Up': 'シャンプーボム',
        'Soaping Spree': 'みんなでシャンプーボム',
        'Specter of Might': '亡念幻身',
        'Squeaky Clean': '水拭き',
        'Sundered Remains': '闘場隆起',
        'Total Wash': '水洗い',
        'Wrath of Ruin': '亡念励起',
      },
    },
  ],
};

export default triggerSet;
