import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';
// 🡸🡺🔵🔴🟡🟢🔘💫❱❰🟦🟥

// TODO: Gladiator adjustments to timeline
// TODO: Shadowcaster Infern Brand 1 and 4 safe location triggers if possible
// TODO: Shadowcaster adjustments to timeline

type RushVec = { x: number; y: number; l: number };
const puffWind = 'CE9';
const puffIce = 'CEA';
const puffLightning = 'CEB';

const firstInLine = 'BBC';
const secondInLine = 'BBD';

export type Visage = { gold: number; silver: number };

export interface Data extends RaidbossData {
  suds?: string;
  puffCounter: number;
  silkenPuffs: { [id: string]: { effect: string; location: string; x: number; y: number } };
  freshPuff2SafeAlert?: string;
  soapCounter: number;
  beaterCounter: number;
  spreeCounter: number;
  mightCasts: NetMatches['StartsUsing'][];
  hasLingering?: boolean;
  isCurseSpreadFirst?: boolean;
  thunderousEchoPlayer?: string;
  myVisage: Visage;
  visageMap: { [squareId: number]: Visage };
  screamOfTheFallen: { [player: string]: string };
  arcaneFontCounter: number;
  myFlame?: number;
  brandEffects: { [effectId: number]: string };
  brandCounter: number;
  myLastCut?: number;
  firstColorCut?: 'orange' | 'blue';
  flamesCutCounter: number;
  waveCounter: number;
  //
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

export const headingTo4Dir = (heading: number) => {
  // Dirs: N = 0, E = 1, S = 2, W = 3
  return (2 - Math.round(heading * 2 / Math.PI)) % 4;
};

const visageMapIdx = (col: number, row: number) => row * 4 + col;

const triggerSet: TriggerSet<Data> = {
  id: 'AnotherSildihnSubterrane',
  zoneId: ZoneId.AnotherSildihnSubterrane,
  timelineFile: 'another_sildihn_subterrane.txt',
  initData: () => {
    return {
      puffCounter: 0,
      silkenPuffs: {},
      soapCounter: 0,
      beaterCounter: 0,
      spreeCounter: 0,
      mightCasts: [],
      myVisage: { gold: 0, silver: 0 },
      visageMap: {},
      screamOfTheFallen: {},
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
      id: 'ASS Atropine Spore',
      type: 'StartsUsing',
      netRegex: { id: '7960', source: 'Aqueduct Belladonna', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'ASS Frond Affront',
      type: 'StartsUsing',
      netRegex: { id: '7961', source: 'Aqueduct Belladonna', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'ASS Deracinator',
      type: 'StartsUsing',
      netRegex: { id: '7962', source: 'Aqueduct Belladonna' },
      response: Responses.tankBuster(),
    },
    {
      id: 'ASS Left Sweep',
      type: 'StartsUsing',
      netRegex: { id: '7964', source: 'Aqueduct Kaluk', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'ASS Right Sweep',
      type: 'StartsUsing',
      netRegex: { id: '7963', source: 'Aqueduct Kaluk', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'ASS Creeping Ivy',
      type: 'StartsUsing',
      netRegex: { id: '7965', source: 'Aqueduct Kaluk', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'ASS Honeyed Left',
      type: 'StartsUsing',
      netRegex: { id: '795B', source: 'Aqueduct Udumbara', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'ASS Honeyed Right',
      type: 'StartsUsing',
      netRegex: { id: '795C', source: 'Aqueduct Udumbara', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'ASS Honeyed Front',
      type: 'StartsUsing',
      netRegex: { id: '795D', source: 'Aqueduct Udumbara', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'ASS Arboreal Storm',
      type: 'StartsUsing',
      netRegex: { id: '7957', source: 'Aqueduct Dryad', capture: false },
      response: Responses.getOut(),
    },
    // ---------------- Silkie ----------------
    {
      id: 'ASS Soap\'s Up',
      type: 'StartsUsing',
      netRegex: { id: '775A', source: 'Silkie', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟡비스듬 → 흩어져요',
          de: 'Kardinal',
          fr: 'Cardinaux',
          ja: '🟡斜め → 散会',
          ko: '십자방향으로',
        },
      },
    },
    {
      id: 'ASS Dust Bluster',
      type: 'StartsUsing',
      netRegex: { id: '776C', source: 'Silkie', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'ASS Fresh Puff Tracker',
      // Use this separate trigger to increment data.puffCounter,
      // since we have multiple triggers to handle different Fresh Puffs
      type: 'StartsUsing',
      netRegex: { id: '7766', source: 'Silkie', capture: false },
      preRun: (data) => {
        ++data.puffCounter;
        data.silkenPuffs = {};
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
      id: 'ASS Silken Puff Suds Gain',
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
        if (puffLoc === undefined)
          return;
        data.silkenPuffs[matches.targetId] = {
          effect: matches.effectId,
          location: puffLoc,
          x: puffX,
          y: puffY,
        };
      },
    },
    {
      id: 'ASS Silken Puff Suds Lose',
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
      id: 'ASS Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: { id: '7751', source: 'Silkie', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'ASS Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: { id: '7752', source: 'Silkie', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'ASS Silkie Suds Gain',
      // Silkie:
      // CE1 Bracing Suds (Wind / Donut)
      // CE2 Chilling Suds (Ice / Cardinal)
      // CE3 Fizzling Suds (Lightning / Intercardinal)
      type: 'GainsEffect',
      netRegex: { effectId: 'CE[1-3]', target: 'Silkie' },
      run: (data, matches) => data.suds = matches.effectId,
    },
    {
      id: 'ASS Silkie Suds Lose',
      // Silkie:
      // CE1 Bracing Suds (Wind / Donut)
      // CE2 Chilling Suds (Ice / Cardinal)
      // CE3 Fizzling Suds (Lightning / Intercardinal)
      type: 'LosesEffect',
      netRegex: { effectId: 'CE[1-3]', target: 'Silkie', capture: false },
      run: (data) => delete data.suds,
    },
    {
      id: 'ASS Fresh Puff 1', // 3 puffs in triangle formation
      type: 'StartsUsing',
      // use 7751/7752 (Squeaky Clean Left/Right), rather than 7766 (Fresh Puff)
      // Squeaky Clean will change the effects of two puffs after the Fresh Puff cast
      // so it is the easiest method to determine mechanic resolution
      netRegex: { id: ['7751', '7752'], source: 'Silkie' },
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
        let stackDir;
        let safeDir;
        if (matches.id === '7751') { // Squeaky Clean Right - resolve based on SW puff's effect
          if (puffsByLoc.SW === undefined)
            return output.default!();
          stackDir = puffsByLoc.SW === puffIce ? 'SE' : 'N'; // if SW is ice, SE stack (unsafe later); if SW is lightning, N stack (unsafe later)
          safeDir = stackDir === 'SE' ? 'N' : 'SE'; // safeDir is the one we are not stacking at
        } else if (matches.id === '7752') { // Squeaky Clean Left - resolve based on SE puff's effect
          if (puffsByLoc.SE === undefined)
            return output.default!();
          stackDir = puffsByLoc.SE === puffIce ? 'SW' : 'N'; // if SE is ice, SW stack (unsafe later); if SE is lightning, N stack (unsafe later)
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
          de: 'Sammeln ${dir1} (${dir2} danach sicher)',
          fr: 'Package ${dir1} (${dir2} sûr après)',
          ja: '${dir1}で頭割り (あとは${dir2}が安置)',
          ko: '${dir1}쪽에서 쉐어 (이후 ${dir2}쪽이 안전)',
        },
        default: {
          en: '🟢바로 밑에서 뭉쳐요',
          de: 'Neben unsicherem grünen Puschel sammeln',
          fr: 'Pack vers le pompon vert non safe',
          ja: '緑の下で頭割り',
          ko: '초록색 구슬에서 쉐어',
        },
      },
    },
    {
      id: 'ASS Slippery Soap',
      // Happens 5 times in the encounter
      type: 'Ability',
      // Silkie begins casting Slippery Soap (775E), and at the same time, either Silkie or an invisible actor will use 79FB on a player
      // the 79FB ability appears to correspond to the stack marker on that player, so use that ability id instead
      netRegex: { id: '79FB' },
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
          fr: 'Derrière le pompon et le groupe',
          ja: 'たまの一番後ろへ',
          ko: '구슬 맨 뒤로',
        },
        getBehindPuffs: {
          en: '솜털🔘의 맨 뒤로 (동서)',
          de: 'Hinter Puschel und Gruppe (Osten/Westen)',
          fr: 'Derrière les pompons et le groupe (Est/Ouest)',
          ja: 'たまの一番後ろへ (東西)',
          ko: '구슬 맨 뒤로 (동/서)',
        },
        getBehindParty: {
          en: '맨 뒤로',
          de: 'Hinter Gruppe',
          fr: 'Derrière le groupe',
          ja: '一番後ろへ',
          ko: '맨 뒤로',
        },
        getBehindPartyKnockback: {
          en: '넉백! 맨 뒤로',
          de: 'Hinter Gruppe (Rückstoß)',
          fr: 'Derrière le groupe (Poussée)',
          ja: 'ノックバック！ 一番後ろへ',
          ko: '맨 뒤로 (넉백)',
        },
        getInFrontOfPlayer: {
          en: '${player} 앞으로',
          de: 'Sei vor ${player}',
          fr: 'Devant ${player}',
          ja: '${player}の前へ',
          ko: '${player} 앞으로',
        },
        getInFrontOfPlayerKnockback: {
          en: '넉백! ${player} 앞으로',
          de: 'Sei vor ${player} (Rückstoß)',
          fr: 'Devant ${player} (Poussée)',
          ja: 'ノックバック! ${player}の前へ',
          ko: '${player} 앞으로 (넉백)',
        },
      },
    },
    {
      id: 'ASS Slippery Soap with Chilling Suds',
      type: 'StartsUsing',
      netRegex: { id: '775E', source: 'Silkie' },
      condition: (data) => data.suds === 'CE2',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1.5,
      response: Responses.moveAround(),
    },
    {
      id: 'ASS Slippery Soap After',
      type: 'Ability',
      netRegex: { id: '775E', source: 'Silkie', capture: false },
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
          de: 'Kardinal verteilen',
          fr: 'Écartez-vous en cardinal',
          ja: '🟡斜め → 散会',
          ko: '십자방향으로 산개',
        },
        intercards: {
          en: '🔵십자 장판',
          de: 'Interkardinal',
          fr: 'Intercardinal',
          ja: '🔵十字, 避けて',
          cn: '四角',
          ko: '대각선 쪽으로',
        },
      },
    },
    {
      id: 'ASS Carpet Beater',
      type: 'StartsUsing',
      netRegex: { id: '774F', source: 'Silkie' },
      preRun: (data) => data.beaterCounter++,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          busterOnYou: Outputs.tankBusterOnYou,
          busterOnTarget: Outputs.tankBusterOnPlayer,
          busterOnYouPuffs: {
            en: '내게 탱크버스터, 동서로 유도',
            de: 'Tank Buster auf DIR, Osten/Westen zwischen Puschel',
            fr: 'Tankbuster sur VOUS, entre les pompons Est/Ouest',
            ja: '自分に強攻撃、東西で誘導',
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
      id: 'ASS Soaping Spree',
      // Boss does not cast Fizzling Duster with Soaping Spree
      type: 'StartsUsing',
      netRegex: { id: '7767', source: 'Silkie', capture: false },
      condition: (data) => {
        ++data.spreeCounter;
        // skip 2nd and 3rd sprees - those are handled by separate Fresh Puff triggers because safe area can be more nuanced
        return data.spreeCounter !== 2 && data.spreeCounter !== 3;
      },
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case 'CE1':
            // TODO: does spree 4 need an earlier warning to move the boss away from blue puffs?
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
          fr: 'Sous le pompon vert',
          ja: '🟢貼り付く',
          ko: '초록색 구슬 밑으로',
        },
        avoidPuffs: {
          en: '솜털🔘장판 피해요',
          de: 'Weiche den Puschel AoEs aus',
          fr: 'Évitez les AoE des pompons',
          ja: 'たまからのゆか避けて',
          ko: '구슬 장판 피하기',
        },
      },
    },
    {
      id: 'ASS Total Wash',
      type: 'StartsUsing',
      netRegex: { id: '7750', source: 'Silkie', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'ASS Fresh Puff 2 Bait', // 4 puffs on cardinals or intercardinals with tethers
      type: 'Tether',
      netRegex: { source: 'Silken Puff' },
      condition: (data, matches) => matches.target === data.me && data.puffCounter === 2,
      durationSeconds: 6,
      alertText: (data, matches, output) => {
        const dirCards = ['N', 'E', 'S', 'W'];
        let silkieStatus: 'bossWind' | 'bossIce' | undefined = undefined;
        switch (data.suds) {
          case 'CE1': // Middle Safe
            silkieStatus = 'bossWind';
            break;
          case 'CE2': // Intercards Safe
            silkieStatus = 'bossIce';
            // never CE3 (lightning) for this mechanic
        }
        if (silkieStatus === undefined)
          return output.default!();

        const tetheredPuff = data.silkenPuffs[matches.sourceId];
        if (tetheredPuff === undefined)
          return;

        // See Silken Puff Suds Gain trigger for list of Silken Puff effectIds
        // Puff must be either CEA (Ice / blue) or CEB (Lightning / yellow) in this mechanic
        const puffEffect = tetheredPuff.effect === puffIce ? 'Blue' : 'Yellow';
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
          de: '${boss} - ${dir} ${puff}',
          fr: '${boss} - ${dir} ${puff}',
          ja: '${boss} - ${dir} ${puff}',
          ko: '${boss} - ${dir} ${puff}',
        },
        bossIce: {
          en: '🔵',
          de: 'Blauer Schweif',
          fr: 'Queue bleue',
          ja: '🔵',
          ko: '파란색 꼬리',
        },
        bossIcePuffsCardinalSafeLater: {
          en: '비스듬 안전 (대부분 🟡앞)',
          de: 'Interkardinal sicher',
          fr: 'Intercardinal sûr',
          ja: '斜め',
          ko: '대각선이 안전',
        },
        bossIcePuffsIntercardSafeLater: {
          en: '비스듬 안전 (대부분 🟡앞)',
          de: 'Interkardinal sicher',
          fr: 'Intercardinal sûr',
          ja: '斜め',
          ko: '대각선이 안전',
        },
        bossWind: {
          en: '🟢',
          de: 'Grüner Schweif',
          fr: 'Queue verte',
          ja: '🟢',
          ko: '초록색 꼬리',
        },
        bossWindPuffsCardinalSafeLater: {
          en: '한가운데가 안전',
          de: 'Mitte sicher',
          fr: 'Milieu sûr',
          ja: '真ん中',
          ko: '가운데가 안전',
        },
        bossWindPuffsIntercardSafeLater: {
          en: '한가운데가 안전',
          de: 'Mitte sicher',
          fr: 'Milieu sûr',
          ja: '真ん中',
          ko: '가운데가 안전',
        },
        // keep tethered puff info as separate outputStrings
        // so users can customize for their particular strat
        bossIceBlueCardinalPuff: {
          en: '🔵파랑 솜털',
          de: 'Blauer Puschel',
          fr: 'Pompon bleu',
          ja: '🔵たま',
          ko: '파란색 구슬',
        },
        bossIceBlueIntercardPuff: {
          en: '🔵파랑 솜털',
          de: 'Blauer Puschel',
          fr: 'Pompon bleu',
          ja: '🔵たま',
          ko: '파란색 구슬',
        },
        bossIceYellowCardinalPuff: {
          en: '🟡노란솜털',
          de: 'Gelber Puschel',
          fr: 'Pompon jaune',
          ja: '🟡たま',
          ko: '노란색 구슬',
        },
        bossIceYellowIntercardPuff: {
          en: '🟡노란솜털',
          de: 'Gelber Puschel',
          fr: 'Pompon jaune',
          ja: '🟡たま',
          ko: '노란색 구슬',
        },
        bossWindBlueCardinalPuff: {
          en: '🔵파랑 솜털',
          de: 'Blauer Puschel',
          fr: 'Pompon bleu',
          ja: '🔵たま',
          ko: '파란색 구슬',
        },
        bossWindBlueIntercardPuff: {
          en: '🔵파랑 솜털',
          de: 'Blauer Puschel',
          fr: 'Pompon bleu',
          ja: '🔵たま',
          ko: '파란색 구슬',
        },
        bossWindYellowCardinalPuff: {
          en: '🟡노란솜털',
          de: 'Gelber Puschel',
          fr: 'Pompon jaune',
          ja: '🟡たま',
          ko: '노란색 구슬',
        },
        bossWindYellowIntercardPuff: {
          en: '🟡노란솜털',
          de: 'Gelber Puschel',
          fr: 'Pompon jaune',
          ja: '🟡たま',
          ko: '노란색 구슬',
        },
        default: {
          en: '솜털 땡겨요~',
          de: 'Puschel ködern',
          fr: 'Attirez le pompon',
          ja: 'たま誘導',
          ko: '구슬 유도',
        },
      },
    },
    {
      id: 'ASS Fresh Puff 2 Safe',
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
          de: '${safe}',
          fr: '${safe}',
          ja: '${safe}',
          ko: '${safe}',
        },
      },
    },
    {
      id: 'ASS Brim Over',
      type: 'Ability',
      netRegex: { id: '776E', source: 'Eastern Ewer', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.avoidEwers!(),
      outputStrings: {
        avoidEwers: {
          en: '항아리 피해요',
          de: 'Krug ausweichen',
          fr: 'Évitez les aiguières',
          ja: '壺確認',
          ko: '항아리 피하기',
        },
      },
    },
    {
      // For Fresh Puff 3, there are eight Silken Puffs in two rows.  Six are then "rinsed" by Eastern Ewers.
      // After suds effects are applied to all eight Silken Puffs, Silkie uses 'Eastern Ewers' (776D),
      // followed by three (existing) Eastern Ewer combatants using 'Brim Over' (776E).
      // ~1.6 seconds later, 3 new 'Eastern Ewer' combatants are added, who begin using 'Rinse' (776F).
      // They repeat using the Rinse ability about ~0.85 seconds as they move N->S through the arena.
      // On three of those recasts, they target the ability on Silken Puffs in their column (same ability ID, 776F):
      // 1st targets the N-most Puff; 2nd targets both Puffs in the column (separate 21 lines for each Puff); and 3rd targets just the S Puff.
      // As each Puff is targeted by a Rinse ability, it loses its Suds effect.
      // This trigger fires off of the first targeted use of 'Rinse'.
      id: 'ASS Fresh Puff 3',
      type: 'Ability',
      netRegex: { id: '776F', source: 'Eastern Ewer', target: 'Silken Puff', capture: false },
      delaySeconds: 1.1, // wait for the Ewers to 'rinse' the six puffs, leaving 2 with status effects
      durationSeconds: 6, // leave alert up while Ewers finish rinsing until Puffs detonate
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (Object.keys(data.silkenPuffs).length !== 2)
          return output.default!();

        // Green and yellow are very hard to differentiate for some colorblind folks,
        // so give a north/south direction for any green or yellow.
        let dirStr: string = output.unknown!();

        for (const puff of Object.values(data.silkenPuffs)) {
          if (puff.effect === puffWind || puff.effect === puffLightning) {
            dirStr = puff.y < silkieCenterY ? output.northPuff!() : output.southPuff!();

            // Wind takes precedence (since it can be with lightning)
            if (puff.effect === puffWind)
              break;
          }
        }

        // sort to simplify switch statement later
        const [puff0, puff1] = Object.values(data.silkenPuffs).map((x) => x.effect).sort();

        // See Silken Puff Suds Gain trigger for list of Silken Puff effectIds
        if (puff0 === puffWind && puff1 === puffLightning)
          return output.windAndLightning!({ dir: dirStr });
        if (puff0 === puffIce && puff1 === puffIce)
          return output.doubleIce!();
        if (puff0 === puffIce && puff1 === puffLightning)
          return output.iceAndLightning!({ dir: dirStr });
        if (puff0 === puffLightning && puff1 === puffLightning)
          return output.doubleLightning!();
        return output.default!();
      },
      outputStrings: {
        windAndLightning: {
          en: '${dir} 밑 🟢으로',
          de: 'Unter den grünen Puschel im ${dir}',
          ja: '${dir}の下🟢',
          ko: '${dir} 초록색 구슬 밑으로',
        },
        doubleIce: {
          en: '비스듬히, 솜털 피해요',
          de: 'Interkardinal, weg von den Puscheln',
          fr: 'Intercadinal, loin des pompons',
          ja: '斜め、たまから離れる',
          ko: '대각선으로, 구슬에서 떨어지기',
        },
        iceAndLightning: {
          en: '${dir}옆 🟡으로',
          de: 'Seitlich des gelben Puschel im ${dir}',
          ja: '${dir}横🟡へ',
          ko: '${dir} 노란색 구슬 옆으로',
        },
        doubleLightning: {
          en: '솜털 사이로',
          de: 'Zwischen Puscheln',
          fr: 'Entre les pompons',
          ja: 'たまとたまの間',
          ko: '구슬 사이로',
        },
        default: {
          en: '솜털 장판 피해요',
          de: 'Puschel AoEs vermeiden',
          fr: 'Évitez les AoE des pompons',
          ja: 'たまのゆか回避',
          ko: '구슬 장판 피하기',
        },
        northPuff: Outputs.north,
        southPuff: Outputs.south,
        unknown: Outputs.unknown,
      },
    },
    // ---------------- second trash ----------------
    {
      id: 'ASS Infernal Pain',
      type: 'StartsUsing',
      netRegex: { id: '7969', source: 'Sil\'dihn Dullahan', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'ASS Blighted Gloom',
      type: 'StartsUsing',
      netRegex: { id: '7966', source: 'Sil\'dihn Dullahan', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'ASS King\'s Will',
      type: 'StartsUsing',
      netRegex: { id: '7968', source: 'Sil\'dihn Dullahan', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자기 강화',
          de: 'große Auto-Hits',
          fr: 'Grosses attaques auto',
          ja: '自己強化',
          ko: '평타 강화',
        },
      },
    },
    {
      id: 'ASS Hells\' Nebula',
      type: 'StartsUsing',
      netRegex: { id: '796C', source: 'Sil\'dihn Armor', capture: false },
      condition: (data) => data.role === 'healer',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '체력이 1이네!',
          de: 'HP auf 1',
          fr: 'HP à 1',
          ja: '体力１!',
          ko: 'HP 1',
        },
      },
    },
    {
      id: 'ASS Infernal Weight',
      type: 'StartsUsing',
      netRegex: { id: '796B', source: 'Sil\'dihn Armor', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '헤비, 발 밑으로',
          de: 'AoE + Rein',
          fr: 'AoE + Intérieur',
          ja: 'ヘビィ, 足元へ',
          ko: '전체공격 + 안으로',
        },
      },
    },
    {
      id: 'ASS Dominion Slash',
      type: 'StartsUsing',
      netRegex: { id: '796A', source: 'Sil\'dihn Armor', capture: false },
      response: Responses.getBehind(),
    },
    // ---------------- Gladiator of Sil'dih ----------------
    {
      id: 'ASS Flash of Steel',
      type: 'StartsUsing',
      netRegex: { id: '7671', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.aoe(),
    },
    /* 안씀
    {
      id: 'ASS Rush of Might 1',
      // Boss casts 765C (12.2s) and 765B (10.2s), twice
      // Gladiator of Mirage casts 7659, 7658, 765A, these target the environment
      type: 'StartsUsing',
      netRegex: { id: ['7658', '7659', '765A'] },
      infoText: (data, matches, output) => {
        data.mightCasts.push(matches);

        const [mirage1, mirage2] = data.mightCasts;
        if (data.mightCasts.length !== 2 || mirage1 === undefined || mirage2 === undefined)
          return;

        data.mightCasts = [];

        const lineMap: { [id: string]: number } = {
          '7658': 1,
          '7659': 2,
          '765A': 3,
        };

        const [line1, line2] = [mirage1.id, mirage2.id].map((x) => lineMap[x]);
        if (line1 === undefined || line2 === undefined)
          throw new UnreachableCode();

        const centerY = -268;
        const isNorth = parseFloat(mirage1.y) < centerY;
        const is1East = parseFloat(mirage1.x) > parseFloat(mirage2.x);
        const isLine1Left = isNorth && is1East || !isNorth && !is1East;
        const [leftNum, rightNum] = isLine1Left ? [line1, line2] : [line2, line1];

        // Call out the bigger number first, as it's the direction you'll have to move the most.
        if (leftNum === 3 && rightNum === 2)
          return output.goLeft3Right2!();
        if (leftNum === 3 && rightNum === 1)
          return output.goLeft3Right1!();
        if (leftNum === 2 && rightNum === 1)
          return output.goLeft2Right1!();
        if (rightNum === 3 && leftNum === 2)
          return output.goRight3Left2!();
        if (rightNum === 3 && leftNum === 1)
          return output.goRight3Left1!();
        if (rightNum === 2 && leftNum === 1)
          return output.goRight2Left1!();
      },
      outputStrings: {
        goLeft3Right2: {
          en: 'Go 3 Left 2 Right',
          de: 'Gehe Links 3, Rechts 2',
          ja: '左: 3, 右: 2',
        },
        goLeft3Right1: {
          en: 'Go 3 Left (on line)',
          de: 'Gehe Links 3 (auf der Linie)',
          ja: '左: 3 (線の上)',
        },
        goLeft2Right1: {
          en: 'Go 2 Left (on line)',
          de: 'Gehe Links 2 (auf der Linie)',
          ja: '左: 2 (線の上)',
        },
        goRight3Left2: {
          en: 'Go 3 Right 2 Left',
          de: 'Gehe Rechts 3, Links 2',
          ja: '右: 3, 左: 2',
        },
        goRight3Left1: {
          en: 'Go 3 Right (on line)',
          de: 'Gehe Rechts 3 (auf der Linie)',
          ja: '右: 3 (線の上)',
        },
        goRight2Left1: {
          en: 'Go 2 Right (on line)',
          de: 'Gehe Rechts 2 (auf der Linie)',
          ja: '右: 2 (線の上)',
        },
      },
    },
    {
      id: 'ASS Rush of Might 2',
      type: 'Ability',
      netRegex: { id: '765B', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.moveThrough!(),
      outputStrings: {
        moveThrough: {
          en: 'Move through',
          de: 'Gehe durch',
          ja: '移動',
        },
      },
    },
    */
    {
      id: 'ASS Sculptor\'s Passion',
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
          ja: '${player}に突進',
          cn: '蓝球点${player}',
          ko: '"${player}" 돌진 대상',
        },
        chargeOnYou: {
          en: '내게 돌진!',
          de: 'Ansturm auf DIR',
          fr: 'Charge sur VOUS',
          ja: '自分に突進',
          cn: '蓝球点名',
          ko: '돌진 대상자',
        },
      },
    },
    {
      id: 'ASS Mighty Smite',
      type: 'StartsUsing',
      netRegex: { id: '7672', source: 'Gladiator of Sil\'dih' },
      response: Responses.tankBuster(),
    },
    {
      id: 'ASS Lingering Echoes',
      // CDC Lingering Echoes (Spread + Move)
      type: 'GainsEffect',
      netRegex: { effectId: 'CDC' },
      condition: Conditions.targetIsYou(),
      preRun: (data) => data.hasLingering = true,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      // response: Responses.moveAway(),
    },
    {
      id: 'ASS Thunderous Echo Collect',
      // CDD Thunderous Echo (Stack)
      type: 'GainsEffect',
      netRegex: { effectId: 'CDD' },
      preRun: (data, matches) => data.thunderousEchoPlayer = matches.target,
    },
    {
      id: 'ASS Curse of the Fallen',
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
        const duration = parseFloat(matches.duration);
        data.isCurseSpreadFirst = duration < 16;

        if (data.isCurseSpreadFirst) {
          if (data.hasLingering)
            return output.spreadThenBait!();
          if (data.me === data.thunderousEchoPlayer)
            return output.spreadThenStackOnYou!();
          if (data.thunderousEchoPlayer === undefined)
            return output.spreadThenStack!();
          return output.spreadThenStackOn!({ player: data.ShortName(data.thunderousEchoPlayer) });
        }

        if (data.hasLingering)
          return output.baitThenSpread!();
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
          fr: 'Package sur ${player} -> Dispersion',
          ja: '頭割り => 散会 (${player})',
          ko: '${player} 쉐어 => 산개',
        },
        stackOnYouThenSpread: {
          en: '내게 뭉쳤다 => 흩어져요',
          de: 'Auf DIR sammeln => Verteilen',
          fr: 'Package sur VOUS -> Dispersion',
          ja: '自分に頭割り => 散会',
          ko: '나에게 쉐어 => 산개',
        },
        spreadThenStack: Outputs.spreadThenStack,
        spreadThenStackOn: {
          en: '흩어졌다 => 뭉쳐요 (${player})',
          de: 'Verteilen => Auf ${player} sammeln',
          fr: 'Dispersion -> Package sur ${player}',
          ja: '散会 => 頭割り (${player})',
          ko: '산개 => ${player} 쉐어',
        },
        spreadThenStackOnYou: {
          en: '흩어졌다 => 내게 뭉쳐요',
          de: 'Verteilen => Auf DIR sammeln',
          fr: 'Dispersion -> package sur VOUS',
          ja: '散会 => 自分に頭割り',
          ko: '산개 => 나에게 쉐어',
        },
        spreadThenBait: {
          en: '내가 링거, 홀로 있다가 장판 피해욧',
          de: 'Veretilen => Fläche ködern',
          ja: '散会 => AOE誘導',
          ko: '산개 => 장판 유도',
        },
        baitThenSpread: {
          en: '유도했다가 => 흩어져요',
          de: 'Fläche ködern => Veretilen',
          ja: 'AOE誘導 => 散会',
          ko: '장판 유도 => 산개',
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
          de: 'Außerhalb des inneren Ringes',
          fr: 'À l\'extérieur de l\'anneau intérieur',
          ja: 'リングチャージ ①',
          ko: '안쪽 고리 바깥',
        },
        outsideMiddle: {
          en: '링 차지 ②',
          de: 'Außerhalb des mittleren Ringes',
          fr: 'À l\'extérieur de l\'anneau central',
          ja: 'リングチャージ ②',
          ko: '중간 고리 바깥',
        },
        outsideOuter: {
          en: '링 차지 ③',
          de: 'Außerhalb des äußeren Ringes',
          fr: 'À l\'extérieur de l\'anneau extérieur',
          ja: 'リングチャージ ③',
          ko: '바깥쪽 고리 바깥',
        },
      },
    },
    {
      id: 'ASS Curse of the Fallen Reminder',
      type: 'Ability',
      // Call this when the ring goes off and it's safe to move in.
      netRegex: { id: ['7660', '7661', '7662'], source: 'Gladiator of Sil\'dih' },
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        if (!data.isCurseSpreadFirst)
          return output.spread!();
        if (data.hasLingering)
          return output.baitPuddle!();
        if (matches.target === data.me)
          return output.stackOnYou!();
        return output.stackOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        // TODO: should this also say "In", e.g. "In + Spread" or "Spread (In)"?
        baitPuddle: {
          en: '장판 유도해요',
          de: 'Fläche ködern',
          ja: 'AOE誘導',
          ko: '장판 유도',
        },
        spread: Outputs.spread,
        stackOnYou: Outputs.stackOnYou,
        stackOn: Outputs.stackOnPlayer,
      },
    },
    /* 아래는 안씀
    {
      id: 'ASS Nothing beside Remains',
      type: 'StartsUsing',
      netRegex: { id: '768C', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    */
    {
      id: 'ASS Accursed Visage Collect',
      // CDF = Gilded Fate
      // CE0 = Silvered Fate
      type: 'GainsEffect',
      netRegex: { effectId: ['CDF', 'CE0'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const id = matches.effectId;
        if (id === 'CDF')
          data.myVisage.gold = parseInt(matches.count);
        else if (id === 'CE0')
          data.myVisage.silver = parseInt(matches.count);
      },
    },
    {
      id: 'ASS Golden/Silver Flame Collector',
      // 766F = Golden Flame
      // 7670 = Silver Flame
      type: 'StartsUsing',
      netRegex: { id: ['766F', '7670'], source: 'Hateful Visage' },
      run: (data, matches) => {
        const x = Math.round(parseFloat(matches.x));
        const y = Math.round(parseFloat(matches.y));

        // These mobs have two faces, gold fires in the direction the mob is facing
        // and silver fires in reverse, so the heading needs to be reversed for silver.
        const isSilver = matches.id === '7670';
        const heading = (headingTo4Dir(parseFloat(matches.heading)) + (isSilver ? 2 : 0)) % 4;

        const dir = {
          north: 0,
          east: 1,
          south: 2,
          west: 3,
        } as const;

        const mark = (col: number, row: number) => {
          const visage = data.visageMap[visageMapIdx(col, row)] ??= { gold: 0, silver: 0 };
          if (isSilver)
            visage.silver++;
          else
            visage.gold++;
        };

        // Possible values for positions:
        // x: [-50, -40, -35, -30, -20]
        // y: [-286, -276, -271, -266, -256]

        if (x === -35) {
          // vertical
          const row = Math.round((y + 286) / 10);
          if (heading === dir.west) {
            mark(0, row);
            mark(1, row);
          } else if (heading === dir.east) {
            mark(2, row);
            mark(3, row);
          }
        } else if (y === -271) {
          // horizontal
          const col = Math.round((x + 50) / 10);
          if (heading === dir.north) {
            mark(col, 0);
            mark(col, 1);
          } else if (heading === dir.south) {
            mark(col, 2);
            mark(col, 3);
          }
        }
      },
    },
    {
      id: 'ASS Golden/Silver Flame',
      // 766F = Golden Flame
      // 7670 = Silver Flame
      type: 'StartsUsing',
      netRegex: { id: ['766F', '7670'], source: 'Hateful Visage', capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        // The four inside corners.
        const uptimeIdx = [5, 6, 9, 10];

        const target = { gold: data.myVisage.silver, silver: data.myVisage.gold };
        const targetIsEmpty = target.gold === 0 && target.silver === 0;
        const squares = targetIsEmpty ? uptimeIdx : [...Array(16).keys()];

        let locStr = output.unknown!();
        for (const idx of squares) {
          const visage = data.visageMap[idx] ?? { gold: 0, silver: 0 };
          if (visage.gold === target.gold && visage.silver === target.silver) {
            locStr = {
              0: output.outsideNW!(),
              1: output.outsideNNW!(),
              2: output.outsideNNE!(),
              3: output.outsideNE!(),
              4: output.outsideWNW!(),
              5: output.insideNW!(),
              6: output.insideNE!(),
              7: output.outsideENE!(),
              8: output.outsideWSW!(),
              9: output.insideSW!(),
              10: output.insideSE!(),
              11: output.outsideESE!(),
              12: output.outsideSW!(),
              13: output.outsideSSW!(),
              14: output.outsideSSE!(),
              15: output.outsideSE!(),
            }[idx] ?? output.unknown!();
            break;
          }
        }

        if (target.silver > 0) {
          if (target.gold > 0)
            return output.bothFates!({ loc: locStr });
          return output.gildedFate!({ loc: locStr });
        }
        if (target.gold > 0)
          return output.silveredFate!({ loc: locStr });
        return output.neitherFate!({ loc: locStr });
      },
      run: (data) => data.visageMap = {},
      outputStrings: {
        bothFates: {
          en: '금🥇은🥈으로: ${loc}',
          de: 'Von Silber und Gold treffen lassen (${loc})',
          fr: 'Faites-vous toucher par l\'argent et l\'or (${loc})', // FIXME
          ja: '金銀 一個ずつ (${loc})',
          ko: '은색 + 금색 맞기 (${loc})',
        },
        gildedFate: {
          en: '은🥈x2으로: ${loc}',
          de: 'Von 2 Silber treffen lassen (${loc})',
          fr: 'Faites-vous toucher par les deux argent (${loc})', // FIXME
          ja: '銀 二つ (${loc})',
          ko: '은색 2개 맞기 (${loc})',
        },
        silveredFate: {
          en: '금🥇x2으로: ${loc}',
          de: 'Von 2 Gold treffen lassen (${loc})',
          fr: 'Faites-vous toucher par les deux or (${loc})', // FIXME
          ja: '金 二つ (${loc})',
          ko: '금색 2개 맞기 (${loc})',
        },
        neitherFate: {
          en: '레이저 피해요',
          de: 'Vermeide Silber und Gold (${loc})',
          fr: 'Évitez l\'argent et l\'or (${loc})', // FIXME
          ja: '顔からのビーム全部回避 (${loc})',
          ko: '레이저 피하기 (업타임 ${loc})',
        },
        outsideNW: {
          en: '🡼구석',
          de: 'NW Ecke',
          fr: 'Coin NO',
          ja: '北西 隅',
          cn: '左上 (西北) 角',
          ko: '북서쪽 구석',
        },
        outsideNNW: {
          en: '첫줄🡸',
          de: 'NNW außen',
          fr: 'Extérieur NNO',
          ja: '1列 西の内側',
          cn: '外侧 上偏左 (北偏西)',
          ko: '바깥 북쪽 왼칸',
        },
        outsideNNE: {
          en: '첫줄🡺',
          de: 'NNO außen',
          fr: 'Extérieur NNE',
          ja: '1列 東の内側',
          cn: '外侧 上偏右 (北偏东)',
          ko: '바깥 북쪽 오른칸',
        },
        outsideNE: {
          en: '🡽구석',
          de: 'NO Ecke',
          fr: 'Coin NE',
          ja: '北東 隅',
          cn: '右上 (东北) 角',
          ko: '북동쪽 구석',
        },
        outsideWNW: {
          en: '둘째줄🡸🡸',
          de: 'WNW außen',
          fr: 'Extérieur ONO',
          ja: '2列 西の外側',
          cn: '外侧 左偏上 (西偏北)',
          ko: '바깥 서쪽 위칸',
        },
        insideNW: {
          en: '둘째줄🡸',
          de: 'NW innen',
          fr: 'Intérieur NO',
          ja: '内側 北西',
          cn: '内侧 左上 (西北)',
          ko: '안 북서쪽',
        },
        insideNE: {
          en: '둘째줄🡺',
          de: 'NO innen',
          fr: 'Intérieur NE',
          ja: '内側 北東',
          cn: '内侧 右上 (东北)',
          ko: '안 북동쪽',
        },
        outsideENE: {
          en: '둘째줄🡺🡺',
          de: 'ONO außen',
          fr: 'Extérieur ENE',
          ja: '2列 東の外側',
          cn: '外侧 右偏上 (东偏北)',
          ko: '바깥 동쪽 위칸',
        },
        outsideWSW: {
          en: '세째줄🡸🡸',
          de: 'WSW außen',
          fr: 'Extérieur OSO',
          ja: '3列 西の外側',
          cn: '外侧 左偏下 (西偏南)',
          ko: '바깥 서쪽 아래칸',
        },
        insideSW: {
          en: '세째줄🡸',
          de: 'SW innen',
          fr: 'Intérieur SO',
          ja: '内側 南西',
          cn: '内侧 左下 (西南)',
          ko: '안 남서쪽',
        },
        insideSE: {
          en: '세째줄🡺',
          de: 'SO innen',
          fr: 'Intérieur SE',
          ja: '内側 南東',
          cn: '内侧 右下 (东南)',
          ko: '안 남동쪽',
        },
        outsideESE: {
          en: '세째줄🡺🡺',
          de: 'OSO außen',
          fr: 'Extérieur ESE',
          ja: '3列 東の外側',
          cn: '外侧 右偏下 (东偏南)',
          ko: '바깥 동쪽 아래칸',
        },
        outsideSW: {
          en: '🡿구석',
          de: 'SW Ecke',
          fr: 'Coin SO',
          ja: '南西 隅',
          cn: '左下 (西南) 角',
          ko: '남서쪽 구석',
        },
        outsideSSW: {
          en: '맨아래줄🡸',
          de: 'SSW außen',
          fr: 'Extérieur SSO',
          ja: '4列 西の内側',
          cn: '外侧 下偏左 (南偏西)',
          ko: '바깥 남쪽 왼칸',
        },
        outsideSSE: {
          en: '맨아래줄🡺',
          de: 'SSO außen',
          fr: 'Extérieur SSE',
          ja: '4列 東の内側',
          cn: '外侧 下偏右 (南偏东)',
          ko: '바깥 남쪽 오른칸',
        },
        outsideSE: {
          en: '🡾구석',
          de: 'SO Ecke',
          fr: 'Coin SE',
          ja: '南東 隅',
          cn: '右下 (东南) 角',
          ko: '남동쪽 구석',
        },
        unknown: Outputs.unknown,
      },
    },
    // 그라디아토르: Gilded/Silvered Fate
    /*
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
    */
    {
      id: 'ASS Sundered Remains',
      // Using 7666 Curse of the Monument
      type: 'StartsUsing',
      netRegex: { id: '7666', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.goMiddle(),
    },
    {
      id: 'ASS Curse of the Monument',
      type: 'Ability',
      netRegex: { id: '7666', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.breakChains(),
    },
    {
      id: 'ASS Scream of the Fallen Collect',
      // CDB = Scream of the Fallen (defamation)
      // BBC = First in Line
      // BBD = Second in Line
      // First/Second in Line are only used once all dungeon so we can just trigger off of them
      type: 'GainsEffect',
      netRegex: { effectId: 'BB[CD]' },
      run: (data, matches) => data.screamOfTheFallen[matches.target] = matches.effectId,
    },
    {
      id: 'ASS Scream of the Fallen',
      // BBC = First in Line
      // BBD = Second in Line
      type: 'GainsEffect',
      netRegex: { effectId: 'BB[CD]', capture: false },
      // These debuffs go out very early while running out for chains,
      // so call as people are dodging into the safe spot.
      delaySeconds: 8,
      durationSeconds: 4,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const myBuff = data.screamOfTheFallen[data.me];
        if (myBuff === undefined)
          return;

        // Figure out partner, so that you know if the person running out
        // with you has the same debuff.
        let partner = output.unknown!();
        for (const [name, id] of Object.entries(data.screamOfTheFallen)) {
          if (name === data.me)
            continue;
          if (id === myBuff) {
            partner = data.ShortName(name);
            break;
          }
        }

        if (myBuff === firstInLine)
          return output.spreadFirst!({ player: partner });
        return output.soakFirst!({ player: partner });
      },
      outputStrings: {
        soakFirst: {
          en: '먼저 타워 밟아요 (+${player})',
          de: 'Steh im ersten Turm (mit ${player})',
          ja: 'さきに塔を踏み (+${player})',
        },
        spreadFirst: {
          en: '먼저 흩어져요 (+${player})',
          de: 'Zuerst verteilen (mit ${player})',
          ja: 'さきに散会 (+${player})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'ASS Scream of the Fallen Towers Second',
      type: 'Ability',
      // Triggers off the "Scream of the Fallen" ability from the defamation.
      netRegex: { id: '7678', source: 'Gladiator of Sil\'dih' },
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return;
        return data.screamOfTheFallen[data.me] === firstInLine;
      },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.soakSecond!(),
      outputStrings: {
        soakSecond: {
          en: '둘째 타워 밟아요',
          de: 'Steh im zweiten Turm',
          ja: '塔を踏み',
        },
      },
    },
    {
      id: 'ASS Scream of the Fallen Spread Second',
      type: 'Ability',
      // Triggers off the "Explosion" ability from the towers.
      netRegex: { id: '766A', source: 'Gladiator of Sil\'dih' },
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return;
        return data.screamOfTheFallen[data.me] === secondInLine;
      },
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    // 그라디아토르: Specter of Might
    {
      id: 'ASS+ Specter of Might',
      type: 'StartsUsing',
      netRegex: { id: '7673', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => {
        data.rushCounter++;
        data.rushVecs = [];
      },
    },
    // 그라디아토르: Rush of Might
    {
      id: 'ASS+ Rush of Might',
      type: 'StartsUsing',
      netRegex: { id: ['7658', '7659', '765A'], source: 'Gladiator Mirage' },
      durationSeconds: 9.4,
      infoText: (data, matches, output) => {
        const i2n: { [id: string]: number } = {
          '7658': 1,
          '7659': 2,
          '765A': 3,
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
    // ---------------- Shadowcaster Zeless Gah ----------------
    {
      id: 'ASS Show of Strength',
      type: 'StartsUsing',
      netRegex: { id: '74AF', source: 'Shadowcaster Zeless Gah', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ASS Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: { id: '74AD', source: 'Shadowcaster Zeless Gah' },
      response: Responses.tankCleave(),
    },
    {
      id: 'ASS Infern Brand Counter',
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
      id: 'ASS Arcane Font Tracker',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Font', capture: false },
      // Only run this trigger for second Infern Band, first set of portals
      condition: (data) => data.myFlame === undefined,
      run: (data) => data.arcaneFontCounter++,
    },
    {
      id: 'ASS Infern Brand Collect',
      // Count field on 95D on Infern Brand indicates Brand's number:
      //   1C2 - 1C5, Orange 1 - 4
      //   1C6 - 1C9, Blue 1 - 4
      type: 'GainsEffect',
      netRegex: { effectId: '95D', target: 'Infern Brand' },
      run: (data, matches) => data.brandEffects[parseInt(matches.targetId, 16)] = matches.count,
    },
    {
      id: 'ASS Infern Brand 2 Starting Corner',
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
          de: 'Blaues Kryptogramm ${num}: ${corner} Ecke',
          fr: 'Étendard bleu ${num}: coin ${corner}',
          ja: '青線${num}: ${corner}の隅',
          ko: '파란색 선 ${num}: ${corner} 구석',
        },
        orangeBrandNumCorner: {
          en: '빨강🟥 ${num}번: ${corner}',
          de: 'Oranges Kryptogramm ${num}: ${corner} Ecke',
          fr: 'Étendard orange ${num}: coin ${corner}',
          ja: '赤線${num}: ${corner}の隅',
          ko: '주황색 선 ${num}: ${corner} 구석',
        },
        brandNumCorner: {
          en: '내가 ${num}번: ${corner}',
          de: 'Kryptogramm ${num}: ${corner} Ecke',
          fr: 'Étendard ${num}: coin ${corner}',
          ja: '線${num}: ${corner}の隅',
          ko: '선 ${num}: ${corner} 구석',
        },
        blueBrandNum: {
          en: '컷팅: 파랑🟦 ${num}번',
          de: 'Blaues Kryptogramm ${num}',
          fr: 'Étendard bleu ${num}',
          ja: '青線${num}',
          ko: '파란색 선 ${num}',
        },
        orangeBrandNum: {
          en: '컷팅: 빨강🟥 ${num}번',
          de: 'Oranges Kryptogramm ${num}',
          fr: 'Étendard orange ${num}',
          ja: '赤線${num}',
          ko: '주황색 선 ${num}',
        },
        brandNum: {
          en: '컷팅: ${num}번',
          de: 'Kryptogramm ${num}',
          fr: 'Étendard ${num}',
          ja: '線${num}',
          ko: '선 ${num}',
        },
        northwest: Outputs.arrowNW,
        northeast: Outputs.arrowNE,
        southeast: Outputs.arrowSE,
        southwest: Outputs.arrowSW,
      },
    },
    {
      id: 'ASS Infern Brand 2 First Flame',
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
          fr: 'Coupez Bleu 1',
          ja: '青線1 切る',
          ko: '파란색 1 끊기',
        },
        cutOrangeOne: {
          en: '컷팅: 빨강🟥 1번',
          de: 'Orange 1 durchtrennen',
          fr: 'Coupez Orange 1',
          ja: '赤線1 切る',
          ko: '주황색 1 끊기',
        },
        firstCut: {
          en: '컷팅하세요',
          de: 'Als Erster durchtrennen',
          fr: 'Coupe en 1er',
          ja: '線1 切る',
          ko: '첫번째 선 끊기',
        },
      },
    },
    {
      id: 'ASS Infern Brand 2 Remaining Flames',
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
          fr: 'Coupez Orange ${num}',
          ja: '赤線${num} 切る',
          ko: '주황색 ${num} 끊기',
        },
        cutBlueNum: {
          en: '컷팅: 파랑🟦 ${num}번',
          de: 'Blau ${num} durchtrennen',
          fr: 'Coupez Bleu ${num}',
          ja: '青線${num} 切る',
          ko: '파란색 ${num} 끊기',
        },
      },
    },
    {
      id: 'ASS Infern Brand Cryptic Flame Collect',
      // Collect timestamp for when last cut flame
      type: 'Ability',
      netRegex: { id: '74B7', source: 'Infern Brand' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.myLastCut = Date.parse(matches.timestamp),
    },
    {
      id: 'ASS Banishment',
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
          de: 'Blau Teleport nach Osten',
          fr: 'Téléportation du bleu à l\'Est',
          ja: '3列 🡺',
          ko: '파란색 동쪽 텔레포트',
        },
        blueWest: {
          en: '🡸 맨아랫줄',
          de: 'Blau Teleport nach Westen',
          fr: 'Téléportation du bleu à l\'Ouest',
          ja: '🡸 一番下列',
          ko: '파란색 서쪽 텔레포트',
        },
        orangeEast: {
          en: '둘째줄 🡺',
          de: 'Orange Teleport nach Osten',
          fr: 'Téléportation de l\'orange à l\'Est',
          ja: '2列 🡺',
          ko: '주황색 동쪽 텔레포트',
        },
        orangeWest: {
          en: '🡸 첫째줄',
          de: 'Orange Teleport nach Westen',
          fr: 'Téléportation de l\'orange à l\'Ouest',
          ja: '🡸 1列',
          ko: '주황색 서쪽 텔레포트',
        },
      },
    },
    /* 아래는 안씀
    {
      id: 'ASS Banishment First Ward',
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
          de: 'Köder erste Wehr',
          fr: 'Attirez la 1ère barrière',
          ja: '1番目の扇誘導',
          ko: '첫번째 지팡이 유도하기',
        },
      },
    },
    {
      id: 'ASS Banishment Bait Second Ward',
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
          de: 'Köder zweite Wehr',
          fr: 'Attirez la 2ème barrière',
          ja: '2番目の扇誘導',
          ko: '두번째 지팡이 유도하기',
        },
      },
    },
    */
    {
      id: 'ASS Infern Brand 5 Starting Position',
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
          de: 'Kryptogramm ${num}: Geh in die Mitte',
          fr: 'Étendard ${num} : Au centre',
          ja: '線${num}: 真ん中へ',
          ko: '선 ${num}: 중앙으로',
        },
        outThenBait: {
          en: '내가 ${num}번: ☥기둥으로',
          de: 'Kryptogramm ${num}: Wehr ködern',
          fr: 'Étendard ${num} : Extérieur, Attirez la barrière',
          ja: '線${num}: 外側へ/扇誘導',
          ko: '선 ${num}: 밖으로, 지팡이 유도',
        },
      },
    },
    {
      id: 'ASS Infern Brand 5 First Flame',
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
          fr: '1ère coupe',
          ja: '1番目の線切る',
          ko: '첫번째 선 끊기',
        },
      },
    },
    {
      id: 'ASS Infern Brand 5 Infern Wave Counter',
      type: 'Ability',
      netRegex: { id: '74BB', source: 'Infern Brand', capture: false },
      condition: (data) => data.brandCounter === 5,
      preRun: (data) => data.waveCounter++,
      suppressSeconds: 1,
    },
    {
      id: 'ASS Infern Brand 5 Cuts after Baits',
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
            fr: 'Coupez Orange ${num}',
            ja: '赤線${num} 切る',
            ko: '주황색 ${num} 끊기',
          },
          cutBlueNum: {
            en: '컷팅: 파랑🟦 ${num}번',
            de: 'Blau ${num} durchtrennen',
            fr: 'Coupez Bleu ${num}',
            ja: '青線${num} 切る',
            ko: '파란색 ${num} 끊기',
          },
          moveOrange: {
            en: '컷팅준비: 빨강🟥 ${num}번',
            de: 'Bewegen für Orange ${num}',
            fr: 'Bougez pour l\'orange ${num}',
            ja: 'まもなく赤線${num}',
            ko: '주황색 ${num} 끊을 준비',
          },
          moveBlue: {
            en: '컷팅준비: 파랑🟦 ${num}번',
            de: 'Bewegen für Blau ${num}',
            fr: 'Bougez pour le bleu ${num}',
            ja: 'まもなく青線${num}',
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
      id: 'ASS Infern Brand 5 Remaining Flames',
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
            de: 'Köder Wehr 2 => Köder Flächen',
            fr: 'Attirez barrière 2 -> Attirez les puddles',
            ja: '扇２ => AOE誘導',
            ko: '지팡이 2 유도 => 장판 유도',
          },
          baitWardThree: {
            en: '셋째 기둥으로',
            de: 'Köder Wehr 3',
            fr: 'Attirez barrière 3',
            ja: '扇３',
            ko: '지팡이 3 유도',
          },
          baitPuddles: {
            en: '장판 깔아요',
            de: 'Köder Flächen',
            fr: 'Attirez les puddles',
            ja: 'AOE誘導',
            ko: '장판 유도',
          },
          cutOrangeNum: {
            en: '컷팅: 빨강🟥 ${num}번',
            de: 'Orange ${num} durchtrennen',
            fr: 'Coupez Orange ${num}',
            ja: '赤線${num} 切る',
            ko: '주황색 ${num} 끊기',
          },
          cutBlueNum: {
            en: '컷팅: 파랑🟦 ${num}번',
            de: 'Blau ${num} durchtrennen',
            fr: 'Coupez Bleu ${num}',
            ja: '青線${num} 切る',
            ko: '파란색 ${num} 끊기',
          },
          moveOrangeNum: {
            en: '컷팅준비: 빨강🟥 ${num}번',
            de: 'Bewegen für Orange ${num}',
            fr: 'Bougez pour l\'orange ${num}',
            ja: 'まもなく赤線${num}',
            ko: '주황색 ${num} 끊을 준비',
          },
          moveBlueNum: {
            en: '컷팅준비: 파랑🟦 ${num}번',
            de: 'Bewegen für Blau ${num}',
            fr: 'Bougez pour le bleu ${num}',
            ja: 'まもなく青線${num}',
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
      id: 'AS+ 젤레스가 Cryptic Portal',
      type: 'StartsUsing',
      netRegex: { id: '7494', source: 'Shadowcaster Zeless Gah' },
    },
    */
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
      run: (data, matches) => data.firesteelStrikes.push(matches.target),
    },
    //
    {
      id: 'ASS+ Blessed Beacon',
      type: 'StartsUsing',
      netRegex: { id: '74B3', source: 'Shadowcaster Zeless Gah' },
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
        'Sil\'dihn Armor': 'Sil\'dih-Kampfmaschine',
        'Sil\'dihn Dullahan': 'Sil\'dih-Dullahan',
        'Silken Puff': 'weich(?:e|er|es|en) Puschel',
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
      'missingTranslations': true,
      'replaceSync': {
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
        'Sil\'dihn Armor': 'armure maléfique sildien',
        'Sil\'dihn Dullahan': 'dullahan sildien',
        'Silken Puff': 'pompon de Silkie',
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
      'missingTranslations': true,
      'replaceSync': {
        'Aqueduct Belladonna': 'アクアダクト・ベラドンナ',
        'Aqueduct Dryad': 'アクアダクト・ドライアド',
        'Aqueduct Kaluk': 'アクアダクト・カルク',
        'Aqueduct Udumbara': 'アクアダクト・ウドンゲ',
        'Arcane Font': '立体魔法陣',
        'Ball of Fire': '火炎球',
        'Eastern Ewer': '洗い壺',
        'Gladiator of Sil\'dih': 'シラディハ・グラディアトル',
        'Hateful Visage': '呪像起動',
        'Infern Brand': '呪具設置',
        'Shadowcaster Zeless Gah': '影火のゼレズ・ガー',
        'Sil\'dihn Armor': 'シラディハ・イビルアーマー',
        'Sil\'dihn Dullahan': 'シラディハ・デュラハン',
        'Silken Puff': 'シルキーズ・ポンポン',
        'Silkie': 'シルキー',
        'The Trial of Balance': '参の試練',
        'The Trial of Knowledge': '壱の試練',
        'The Trial of Might': '弐の試練',
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
    {
      'locale': 'cn',
      'replaceSync': {
        'Aqueduct Belladonna': '水道剧毒美人',
        'Aqueduct Dryad': '水道树妖',
        'Aqueduct Kaluk': '水道卡栌克',
        'Aqueduct Udumbara': '水道优昙婆罗花',
        'Arcane Font': '立体魔法阵',
        'Ball of Fire': '火球',
        'Eastern Ewer': '倒水瓶',
        'Gladiator of Sil\'dih': '希拉狄哈剑斗士',
        'Hateful Visage': '亡国咒像',
        'Infern Brand': '蜥蜴人咒具',
        'Shadowcaster Zeless Gah': '鬼阴火 泽雷斯·夏',
        'Sil\'dihn Armor': '希拉狄哈恶魔装甲',
        'Sil\'dihn Dullahan': '希拉狄哈无头骑士',
        'Silken Puff': '羽衣精的绒球',
        'Silkie': '羽衣精',
        'The Trial of Balance': '第三试炼',
        'The Trial of Knowledge': '第一试炼',
        'The Trial of Might': '第二试炼',
      },
      'replaceText': {
        'Accursed Visage': '咒怨咒像',
        'Banishment': '强制传送之咒',
        'Blazing Benifice': '圣火炮',
        'Blessed Beacon': '祝福圣火',
        'Bracing Duster': '风清除尘',
        'Bracing Suds': '风清泡泡',
        'Burn': '燃烧',
        'Carpet Beater': '拍毯子',
        'Cast Shadow': '影火咒式',
        'Chilling Duster': '冰凉除尘',
        'Chilling Suds': '冰凉泡泡',
        'Colossal Wreck': '亡国灵塔',
        'Cryptic Flames': '火焰咒印',
        'Cryptic Portal': '传送咒印',
        'Curse of the Fallen': '咒怨咆哮',
        'Curse of the Monument': '咒怨连击',
        'Dust Bluster': '掸土',
        'Eastern Ewers': '倒水瓶',
        'Echo of the Fallen': '咒怨残响',
        'Explosion': '爆炸',
        'Firesteel Fracture': '石火豪打',
        'Firesteel Strike': '石火豪冲',
        'Fizzling Duster': '电气除尘',
        'Fizzling Suds': '电气泡泡',
        'Flash of Steel': '斗士波动',
        'Fresh Puff': '创造绒球',
        'Gold Flame': '黄金闪火',
        'Hateful Visage': '启动咒像',
        'Infern Brand': '设置咒具',
        'Infern Ward': '咒具警阵',
        'Infern Wave': '咒具流火',
        'Mighty Smite': '斗士斩击',
        'Nothing beside Remains': '座下隆起',
        'Puff and Tumble': '绒球翻滚',
        'Pure Fire': '劫火',
        'Rinse': '漂洗',
        'Rush of Might': '刚武突击',
        'Scream of the Fallen': '咒怨大残响',
        'Sculptor\'s Passion': '斗士炮',
        'Show of Strength': '勇士的咆哮',
        'Silver Flame': '白银闪火',
        'Slippery Soap': '泡泡滑行',
        'Soap\'s Up': '泡泡破裂',
        'Soaping Spree': '泡泡总动员',
        'Specter of Might': '亡念幻影',
        'Squeaky Clean': '擦拭',
        'Sundered Remains': '场地隆起',
        'Total Wash': '水洗',
        'Wrath of Ruin': '亡念激起',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Aqueduct Belladonna': '지하수도 벨라돈나',
        'Aqueduct Dryad': '지하수도 드라이어드',
        'Aqueduct Kaluk': '지하수도 칼루크',
        'Aqueduct Udumbara': '지하수도 우담바라',
        'Arcane Font': '입체마법진',
        'Ball of Fire': '불덩이',
        'Eastern Ewer': '물동이',
        'Gladiator of Sil\'dih': '실디하 검투사',
        'Hateful Visage': '망국의 저주상',
        'Infern Brand': '아말쟈 주술도구',
        'Shadowcaster Zeless Gah': '그림자불 젤레즈 가',
        'Sil\'dihn Armor': '실디하 사악한 갑옷',
        'Sil\'dihn Dullahan': '실디하 둘라한',
        'Silken Puff': '실키 폼폼',
        'Silkie': '실키',
        'The Trial of Balance': '세 번째 시련',
        'The Trial of Knowledge': '첫 번째 시련',
        'The Trial of Might': '두 번째 시련',
      },
      'replaceText': {
        'Accursed Visage': '원한의 저주상',
        'Banishment': '강제 전송 주술',
        'Blazing Benifice': '성화포',
        'Blessed Beacon': '하늘의 성화',
        'Bracing Duster': '산들산들 닦기',
        'Bracing Suds': '산들산들 비누거품',
        'Burn': '연소',
        'Carpet Beater': '융단 털기',
        'Cast Shadow': '그림자불 주술식',
        'Chilling Duster': '오들오들 닦기',
        'Chilling Suds': '오들오들 비누거품',
        'Colossal Wreck': '망국의 탑',
        'Cryptic Flames': '화염 주술인',
        'Cryptic Portal': '묵직한 문',
        'Curse of the Fallen': '저주의 포효',
        'Curse of the Monument': '저주 연격',
        'Dust Bluster': '먼지 털기',
        'Eastern Ewers': '물동이',
        'Echo of the Fallen': '저주의 뒤울림',
        'Explosion': '폭발',
        'Firesteel Fracture': '석화호타',
        'Firesteel Strike': '석화호충',
        'Fizzling Duster': '파직파직 닦기',
        'Fizzling Suds': '파직파직 비누거품',
        'Flash of Steel': '투사의 파동',
        'Fresh Puff': '폼폼 만들기',
        'Gold Flame': '황금 섬화',
        'Hateful Visage': '망국의 저주상',
        'Infern Brand': '아말쟈 주술도구',
        'Infern Ward': '주술도구 경비진',
        'Infern Wave': '주술도구 불길',
        'Mighty Smite': '투사의 참격',
        'Nothing beside Remains': '발밑 융기',
        'Puff and Tumble': '폼폼 먼지떨이',
        'Pure Fire': '겁화',
        'Rinse': '헹구기',
        'Rush of Might': '강력한 돌격',
        'Scream of the Fallen': '저주의 큰뒤울림',
        'Sculptor\'s Passion': '투사포',
        'Show of Strength': '용사의 포효',
        'Silver Flame': '백은 섬화',
        'Slippery Soap': '미끄덩 비누 폭탄',
        'Soap\'s Up': '비누 폭탄',
        'Soaping Spree': '다 함께 비누 폭탄',
        'Specter of Might': '망념 환체',
        'Squeaky Clean': '물걸레질',
        'Sundered Remains': '검투장 융기',
        'Total Wash': '물청소',
        'Wrath of Ruin': '망념 상기',
      },
    },
  ],
};

export default triggerSet;
