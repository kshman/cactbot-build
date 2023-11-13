import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  prsSoul?: number;
  //
  decOffset?: number;
  combatantData: PluginCombatantState[];
  dividingWingsTethers: string[];
  dividingWingsStacks: string[];
  dividingWingsEntangling: string[];
  meltdownSpreads: string[];
  daemonicBondsTime?: number;
  daemonicBondsCounter: number;
  bondsSecondMechanic?: 'stack' | 'partners' | 'spread';
  tetradaemonicTarget: string[];
}

const bossNameUnicode = 'Pand\u00e6monium';

const headmarkers = {
  // vfx/lockon/eff/com_share6_5s0c.avfx
  soulGrasp: '01D3',
  // vfx/lockon/eff/m0834trg_b0c.avfx
  webShare: '01AC',
  // vfx/lockon/eff/m0834trg_d0c.avfx
  webEntangling: '01AE',
  // vfx/lockon/eff/m0834trg_a0c.avfx
  webSpread: '01AB',
  // vfx/lockon/eff/lockon5_t0h.avfx
  spread: '0017',
} as const;

const firstHeadmarker = parseInt(headmarkers.soulGrasp, 16);

const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (data.decOffset === undefined)
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const bondsOffsetSeconds = (data: Data): number => {
  const fallbackDelay = 5;
  return {
    // t=145.8, call right after laser before running out to platforms
    1: 13,
    // t=223.9, call after 4th turret goes off
    2: 5,
    // t=329.9, call as donut/circle towers go off before ray
    3: 7,
    // t=459.3, call as harrowing hell knockback starts
    4: 9,
  }[data.daemonicBondsCounter] ?? fallbackDelay;
};

// Helper function to call out the Daemonic Bonds spread/stack/partner ability.
const bondsDelaySeconds = (data: Data, matches: NetMatches['GainsEffect']): number => {
  return parseFloat(matches.duration) - bondsOffsetSeconds(data);
};

const bondsDurationSeconds = (data: Data): number => Math.max(bondsOffsetSeconds(data) - 3, 3);

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheTenthCircleSavage',
  zoneId: ZoneId.AnabaseiosTheTenthCircleSavage,
  timelineFile: 'p10s.txt',
  initData: () => {
    return {
      combatantData: [],
      dividingWingsTethers: [],
      dividingWingsStacks: [],
      dividingWingsEntangling: [],
      meltdownSpreads: [],
      daemonicBondsCounter: 0,
      tetradaemonicTarget: [],
    };
  },
  triggers: [
    {
      id: 'P10S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => getHeadmarkerId(data, matches),
    },
    {
      id: 'P10S Ultima',
      type: 'StartsUsing',
      netRegex: { id: '82A5', source: bossNameUnicode, capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'P10S Soul Grasp',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarkers.soulGrasp,
      /*
      response: Responses.sharedTankBuster(),
      */
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          avoid: Outputs.avoidTankCleave,
          tank: {
            en: '${num}번째 둘이 버스터',
          },
          healer: {
            en: '${num}번째 탱크버스터',
          },
        };

        data.prsSoul = (data.prsSoul ?? 0) + 1;

        if (data.role === 'tank')
          return { alertText: output.tank!({ num: data.prsSoul }) };
        if (data.role === 'healer')
          return { alertText: output.healer!({ num: data.prsSoul }) };
        return { infoText: output.avoid!() };
      },
    },
    {
      id: 'P10S Pandaemon\'s Holy',
      type: 'StartsUsing',
      netRegex: { id: '82A6', source: bossNameUnicode, capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'P10S Circles of Pandaemonium',
      type: 'StartsUsing',
      netRegex: { id: '82A7', source: bossNameUnicode, capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'P10S Wicked Step',
      type: 'StartsUsing',
      netRegex: { id: '8299', source: bossNameUnicode, capture: false },
      alertText: (data, _matches, output) => {
        if (data.party.isTank(data.me))
          return output.soak!();
      },
      infoText: (data, _matches, output) => {
        if (!data.party.isTank(data.me))
          return output.avoid!();
      },
      outputStrings: {
        soak: {
          en: '타워 밟아요',
          de: 'Türme nehmen',
          fr: 'Prenez une tour',
          ja: '塔踏み',
          cn: '踩塔击飞',
          ko: '기둥 들어가기',
        },
        avoid: {
          en: '타워 피해요',
          de: 'Türme vermeiden',
          fr: 'Évitez les tours',
          ja: '塔回避',
          cn: '远离塔',
          ko: '기둥 피하기',
        },
      },
    },
    {
      id: 'P10S Dividing Wings Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '8297', source: bossNameUnicode, capture: false },
      run: (data) => {
        data.dividingWingsTethers = [];
        data.dividingWingsStacks = [];
        data.dividingWingsEntangling = [];
      },
    },
    {
      id: 'P10S Dividing Wings Tether',
      type: 'Tether',
      netRegex: { id: '00F2', source: bossNameUnicode },
      preRun: (data, matches) => data.dividingWingsTethers.push(matches.target),
      promise: async (data, matches) => {
        if (data.me === matches.target) {
          data.combatantData = [];
          const wingId = parseInt(matches.sourceId, 16);
          if (wingId === undefined)
            return;
          data.combatantData = (await callOverlayHandler({
            call: 'getCombatants',
            ids: [wingId],
          })).combatants;
        }
      },
      alarmText: (data, matches, output) => {
        if (data.me === matches.target) {
          const x = data.combatantData[0]?.PosX;
          if (x === undefined)
            return output.default!();
          if (data.options.AutumnStyle) {
            let arrow;
            if (x > 100)
              arrow = output.aright!();
            else if (x < 100)
              arrow = output.aleft!();
            if (arrow === undefined)
              return output.default!();
            return output.atether!({ arrow: arrow });
          }
          let wingDir;
          if (x > 100) {
            wingDir = output.east!();
          } else if (x < 100) {
            wingDir = output.west!();
          }
          if (wingDir !== undefined)
            return output.tetherside!({ dir: wingDir });
          return output.default!();
        }
      },
      outputStrings: {
        tetherside: {
          en: '줄 땡겨요: ${dir}',
          de: 'Zeige ${dir} Verbindung weg',
          fr: 'Orientez le lien à l\'extérieur - ${dir}',
          ja: '線伸ばし ${dir}',
          cn: '向 ${dir} 外侧引导',
          ko: '선을 ${dir}으로',
        },
        default: {
          en: '줄 땡겨요',
          de: 'Zeige Verbindung weg',
          fr: 'Orientez le lien à l\'extérieur',
          ja: '線伸ばし',
          cn: '向外引导',
          ko: '선을 바깥쪽으로',
        },
        west: {
          en: '왼쪽/서쪽',
          de: 'Links/Westen',
          fr: 'Gauche/Ouest',
          ja: '左/西へ',
          cn: '左(西)',
          ko: '왼쪽/서쪽',
        },
        east: {
          en: '오른쪽/동쪽',
          de: 'Rechts/Osten',
          fr: 'Droite/Est',
          ja: '右/東へ',
          cn: '右(东)',
          ko: '오른쪽/동쪽',
        },
        atether: {
          en: '줄 땡겨요: ${arrow}${arrow}',
        },
        aleft: Outputs.arrowW,
        aright: Outputs.arrowE,
      },
    },
    {
      id: 'P10S Dividing Wings Tether Break',
      type: 'Ability',
      netRegex: { id: '827F', source: bossNameUnicode, capture: false },
      condition: (data) => data.dividingWingsTethers.includes(data.me),
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '줄 끊어요',
          de: 'Verbindung brechen',
          fr: 'Cassez les liens',
          ja: '線切る',
          cn: '截断丝线',
          ko: '선 끊기',
        },
      },
    },
    {
      id: 'P10S Dividing Wings Stack You',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarkers.webShare,
      alertText: (data, matches, output) => {
        data.dividingWingsStacks.push(matches.target);
        if (data.me === matches.target)
          return output.stackOnYou!();
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
      },
    },
    {
      id: 'P10S Dividing Wings Stacks',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarkers.webShare,
      delaySeconds: 0.5,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        // Need to check these conditions after the delay as they are ordered:
        // tethers, stack(s), (optional) entangling.
        if (data.dividingWingsTethers.includes(data.me))
          return;
        if (data.dividingWingsStacks.includes(data.me))
          return;
        if (data.dividingWingsEntangling.includes(data.me))
          return;
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '거미집 이어요',
          de: 'Sammeln',
          fr: 'Package',
          ja: 'あたまわり',
          cn: '分摊连线',
          ko: '쉐어',
        },
      },
    },
    {
      id: 'P10S Entangling Web',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return false;
        return getHeadmarkerId(data, matches) === headmarkers.webEntangling;
      },
      alertText: (data, _matches, output) => {
        if (data.prsSoul === 4)
          return output.place!();
        return output.text!();
      },
      // This will happen for non-dividing entangling web headmarkers,
      // but will get cleaned up in time for the next dividing wings.
      run: (data, matches) => data.dividingWingsEntangling.push(matches.target),
      outputStrings: {
        text: {
          // TODO: should we say "on posts" or "on back wall" based on count?
          en: '거미집 지어요',
          de: 'Netze überlappen',
          fr: 'Superposez les toiles',
          ja: 'ウェブ重なる',
          cn: '用网搭桥',
          ko: '거미줄 겹치기',
        },
        place: {
          en: '남쪽 셋이 나란히 거미집 지어요',
        },
      },
    },
    {
      id: 'P10S Pandaemoniac Pillars',
      type: 'StartsUsing',
      netRegex: { id: '8280', source: bossNameUnicode, capture: false },
      response: Responses.getTowers('alert'),
    },
    {
      id: 'P10S Pandaemoniac Turrets',
      type: 'StartsUsing',
      netRegex: { id: '87AF', source: bossNameUnicode, capture: false },
      response: Responses.getTowers('alert'),
    },
    {
      id: 'P10S Silkspit',
      type: 'StartsUsing',
      netRegex: { id: '827C', source: bossNameUnicode, capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져 거미집 지어요',
          de: 'Für Netze verteilen',
          fr: 'Écartez-vous pour les toiles',
          ja: 'ウェブ散会',
          cn: '网分散',
          ko: '거미줄 산개',
        },
      },
    },
    {
      id: 'P10S Pandaemoniac Meltdown Spread',
      // These come out before the meltdown cast below.
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarkers.spread,
      alarmText: (data, matches, output) => {
        data.meltdownSpreads.push(matches.target);
        if (data.me === matches.target)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'P10S Pandaemoniac Meltdown Stack',
      type: 'StartsUsing',
      netRegex: { id: '829D', source: bossNameUnicode, capture: false },
      alertText: (data, _matches, output) => {
        if (!data.meltdownSpreads.includes(data.me))
          return output.text!();
      },
      run: (data) => data.meltdownSpreads = [],
      outputStrings: {
        text: {
          en: '한 줄로 뭉쳐요',
          de: 'Linien-Stack',
          fr: 'Packez-vous en ligne',
          ja: '直線あたまわり',
          cn: '直线分摊',
          ko: '직선 쉐어',
        },
      },
    },
    {
      // Daemoniac Bonds starts casting
      // Then all of the Daemoniac Bonds DDE (spread) effects go out
      // Then 4x DDF or 2x E70 effects go out.
      id: 'P10S Pandaemoniac Bonds Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '82A1', source: bossNameUnicode, capture: false },
      run: (data) => {
        delete data.daemonicBondsTime;
        delete data.bondsSecondMechanic;
        data.tetradaemonicTarget = [];
        data.daemonicBondsCounter++;
      },
    },
    {
      id: 'P10S Tetradaemoniac Bonds Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'E70' },
      run: (data, matches) => {
        data.tetradaemonicTarget.push(matches.target);
      },
    },
    {
      id: 'P10S Daemoniac Bonds Timer',
      type: 'GainsEffect',
      netRegex: { effectId: 'DDE' },
      condition: (data) => data.daemonicBondsTime === undefined,
      run: (data, matches) => data.daemonicBondsTime = parseFloat(matches.duration),
    },
    {
      id: 'P10S Dueodaemoniac Bonds Future',
      type: 'GainsEffect',
      netRegex: { effectId: 'DDF' },
      durationSeconds: 7,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (data.daemonicBondsTime === undefined) {
          console.error(`Daemoniac Bonds: ${matches.effectId} effect before DDE?`);
          return;
        }

        const duration = parseFloat(matches.duration);
        if (duration > data.daemonicBondsTime) {
          data.bondsSecondMechanic = 'partners';
          return output.spreadThenPartners!();
        }

        data.bondsSecondMechanic = 'spread';
        return output.partnersThenSpread!();
      },
      outputStrings: {
        spreadThenPartners: {
          en: '(흩어졌다 => 페어)',
          de: '(Verteilen => Partner, für später)',
          fr: '(Écartez-vous => Partenaires, pour après)',
          ja: '(散会 => ペア)',
          cn: '(稍后 分散 => 分摊)',
          ko: '(곧 산개 => 파트너)',
        },
        partnersThenSpread: {
          en: '(페어 => 흩어져요)',
          de: '(Partner => Verteilen, für später)',
          fr: '(Partenaires => Écartez-vous, pour après)',
          ja: '(ペア => 散会)',
          cn: '(稍后 分摊 => 分散)',
          ko: '(곧 파트너 => 산개)',
        },
      },
    },
    {
      id: 'P10S TetraDaemoniac Bonds Future',
      type: 'GainsEffect',
      netRegex: { effectId: 'E70' },
      durationSeconds: 7,
      infoText: (data, matches, output) => {
        if (data.daemonicBondsTime === undefined) {
          console.error(`Daemoniac Bonds: ${matches.effectId} effect before DDE?`);
          return;
        }
        if (data.tetradaemonicTarget.length !== 2)
          return;

        const duration = parseFloat(matches.duration);
        if (duration > data.daemonicBondsTime) {
          data.bondsSecondMechanic = 'stack';
          if (data.options.AutumnStyle)
            return output.spreadThenStack!({
              player1: data.party.aJobName(data.tetradaemonicTarget[0]),
              player2: data.party.aJobName(data.tetradaemonicTarget[1]),
            });
          return output.spreadThenStack!({
            player1: data.party.member(data.tetradaemonicTarget[0]),
            player2: data.party.member(data.tetradaemonicTarget[1]),
          });
        }

        data.bondsSecondMechanic = 'spread';
        if (data.options.AutumnStyle)
          return output.stackThenSpread!({
            player1: data.party.aJobName(data.tetradaemonicTarget[0]),
            player2: data.party.aJobName(data.tetradaemonicTarget[1]),
          });
        return output.stackThenSpread!({
          player1: data.party.member(data.tetradaemonicTarget[0]),
          player2: data.party.member(data.tetradaemonicTarget[1]),
        });
      },
      outputStrings: {
        spreadThenStack: {
          en: '(흩어졌다 => 4:4 뭉쳐요/${player1},${player2})',
          de: '(Verteilen => Rollengruppe (${player1}, ${player2}), für später)',
          fr: '(Écartez-vous => Package par rôle (${player1}, ${player2}), pour après)', // FIXME
          ja: '(散会 => 4:4あたまわり (${player1}, ${player2}))', // FIXME
          cn: '(稍后 分散 => 四人分摊 (${player1}, ${player2}))',
          ko: '(곧 산개 => 직업군별 쉐어 (${player1}, ${player2}))',
        },
        stackThenSpread: {
          en: '(4:4 뭉쳤다/${player1},${player2} => 흩어져요)',
          de: '(Rollengruppe (${player1}, ${player2}) => Verteilen, für später)',
          fr: '(Package par rôle (${player1}, ${player2}) => Écartez-vous, pour après)', // FIXME
          ja: '(4:4あたまわり (${player1}, ${player2}) => 散会)', // FIXME
          cn: '(稍后 四人分摊 (${player1}, ${player2}) => 分散)',
          ko: '(곧 직업군별 쉐어 (${player1}, ${player2}) => 산개)',
        },
      },
    },
    {
      id: 'P10S Daemoniac Bonds First',
      type: 'GainsEffect',
      netRegex: { effectId: 'DDE' },
      delaySeconds: bondsDelaySeconds,
      durationSeconds: bondsDurationSeconds,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        // If this is undefined, then this is the second mechanic and will be called out elsewhere.
        // We can't make this a `condition` as this is not known until after some delay.
        if (data.options.AutumnStyle && data.bondsSecondMechanic === 'stack')
          return output.spreadThenStack!({
            player1: data.party.aJobName(data.tetradaemonicTarget[0]),
            player2: data.party.aJobName(data.tetradaemonicTarget[1]),
          });
        if (data.bondsSecondMechanic === 'stack')
          return output.spreadThenStack!({
            player1: data.party.member(data.tetradaemonicTarget[0]),
            player2: data.party.member(data.tetradaemonicTarget[1]),
          });
        if (data.bondsSecondMechanic === 'partners')
          return output.spreadThenPartners!();
      },
      outputStrings: {
        spreadThenStack: {
          en: '흩어졌다 => 4:4 뭉쳐요/${player1},${player2}',
          de: 'Verteilen => Rollengruppe (${player1}, ${player2})',
          fr: 'Écartez-vous => Package par rôle (${player1}, ${player2})', // FIXME
          ja: '散会 => 4:4あたまわり (${player1}, ${player2})', // FIXME
          cn: '分散 => 四人分摊 (${player1}, ${player2})',
          ko: '산개 => 직업군별 쉐어 (${player1}, ${player2})',
        },
        spreadThenPartners: {
          en: '흩어졌다 => 페어',
          de: 'Verteilen => Partner',
          fr: 'Écartez-vous => Partenaires',
          ja: '散会 => ペア',
          cn: '分散 => 分摊',
          ko: '산개 => 파트너',
        },
      },
    },
    {
      id: 'P10S Dueodaemoniac Bonds First',
      type: 'GainsEffect',
      netRegex: { effectId: 'DDF' },
      delaySeconds: bondsDelaySeconds,
      durationSeconds: bondsDurationSeconds,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        // If this is undefined, then this is the second mechanic and will be called out elsewhere.
        if (data.bondsSecondMechanic === 'spread')
          return output.partnersThenSpread!();
      },
      outputStrings: {
        partnersThenSpread: {
          en: '페어 => 흩어져요',
          de: 'Partner => Verteilen',
          fr: 'Partenaires => Écartez-vous',
          ja: 'ペア => 散会',
          cn: '分摊 => 分散',
          ko: '파트너 => 산개',
        },
      },
    },
    {
      id: 'P10S TetraDaemoniac Bonds First',
      type: 'GainsEffect',
      netRegex: { effectId: 'E70' },
      delaySeconds: bondsDelaySeconds,
      durationSeconds: bondsDurationSeconds,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        // If this is undefined, then this is the second mechanic and will be called out elsewhere.
        if (data.options.AutumnStyle && data.bondsSecondMechanic === 'spread')
          return output.stackThenSpread!({
            player1: data.party.aJobName(data.tetradaemonicTarget[0]),
            player2: data.party.aJobName(data.tetradaemonicTarget[1]),
          });
        if (data.bondsSecondMechanic === 'spread')
          return output.stackThenSpread!({
            player1: data.party.member(data.tetradaemonicTarget[0]),
            player2: data.party.member(data.tetradaemonicTarget[1]),
          });
      },
      outputStrings: {
        stackThenSpread: {
          en: '4:4 뭉쳤다/${player1},${player2} => 흩어져요',
          de: 'Rollengruppe (${player1}, ${player2}) => Verteilen',
          fr: 'Package par rôle (${player1}, ${player2}) => Écartez-vous', // FIXME
          ja: '4:4あたまわり (${player1}, ${player2}) => 散会', // FIXME
          cn: '四人分摊 (${player1}, ${player2}) => 分散',
          ko: '직업군별 쉐어 (${player1}, ${player2}) => 산개',
        },
      },
    },
    {
      id: 'P10S Daemoniac Bonds Followup',
      type: 'Ability',
      // 82A2 = Daemoniac Bonds (spread)
      // 82A3 = Dueodaemoniac Bonds (partners)
      // 87AE = TetraDaemoniac Bonds (4 person stacks)
      netRegex: { id: ['82A2', '82A3', '87AE'], source: bossNameUnicode, capture: false },
      condition: (data) => data.bondsSecondMechanic !== undefined,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.bondsSecondMechanic === 'spread')
          return output.spread!();
        if (data.bondsSecondMechanic === 'partners')
          return output.partners!();
        if (data.options.AutumnStyle && data.bondsSecondMechanic === 'stack')
          return output.stack!({
            player1: data.party.aJobName(data.tetradaemonicTarget[0]),
            player2: data.party.aJobName(data.tetradaemonicTarget[1]),
          });
        if (data.bondsSecondMechanic === 'stack')
          return output.stack!({
            player1: data.party.member(data.tetradaemonicTarget[0]),
            player2: data.party.member(data.tetradaemonicTarget[1]),
          });
      },
      run: (data) => delete data.bondsSecondMechanic,
      outputStrings: {
        spread: Outputs.spread,
        partners: {
          en: '페어',
          de: 'Partner',
          fr: 'Partenaires',
          ja: 'ペア',
          cn: '分摊',
          ko: '파트너',
        },
        stack: {
          en: '4:4 뭉쳐요/${player1},${player2}',
          de: 'Rollengruppe (${player1}, ${player2})',
          fr: 'Package par rôle (${player1}, ${player2})', // FIXME
          ja: '4:4あたまわり (${player1}, ${player2})', // FIXME
          cn: '四人分摊 (${player1}, ${player2})',
          ko: '직업군별 쉐어 (${player1}, ${player2})',
        },
      },
    },
    {
      id: 'P10S Pandaemoniac Ray',
      type: 'StartsUsing',
      netRegex: { id: ['8289', '828B'], source: bossNameUnicode },
      infoText: (_data, matches, output) => {
        // Half-room cleave west (8289) or east (828B)
        const safeOutput = matches.id === '8289' ? 'east' : 'west';
        return output[safeOutput]!();
      },
      outputStrings: {
        east: {
          en: '🡺▶▶▶',
        },
        west: {
          en: '◀◀◀🡸',
        },
      },
    },
    {
      id: 'P10S Jade Passage',
      // Track addition of Arcane Sphere combatants
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12356' },
      suppressSeconds: 5,
      infoText: (_data, matches, output) => {
        const y = parseInt(matches.y);
        return (Math.floor(y / 2) % 2 === 1) ? output.lines!() : output.boxes!();
      },
      outputStrings: {
        lines: {
          en: '레이저 피해욧 (선┼ 위로)',
          de: 'Auf die Linien (vermeide Laser)',
          fr: 'Sur les lignes (évitez les lasers)',
          ja: 'レーザー回避(マスの境界の上)',
          cn: '站在线上（躲避激光）',
          ko: '경계선 위 (레이저 피하기)',
        },
        boxes: {
          en: '레이저 피해욧 (네모칸□ 안으로)',
          de: 'In den Boxen (vermeide Laser)',
          fr: 'Dans les carrés (évitez les lasers)',
          ja: 'レーザー回避(マスの内側)',
          cn: '站方格内（躲避激光）',
          ko: '네모칸 안 (레이저 피하기)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Pandaemon\'s Holy/Circles of Pandaemonium': 'Holy/Circles',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Arcane Sphere': 'arkan(?:e|er|es|en) Körper',
        'Pand(?:\\\\u00e6|\u00e6)moniac Pillar': 'pand\u00e6monisch(?:e|er|es|en) Turm',
        'Pand(?:\\\\u00e6|\u00e6)monium': 'Pand\u00e6monium',
      },
      'replaceText': {
        '\\(cast\\)': '(Wirken)',
        '\\(cone\\)': '(Kegel-AoE)',
        '\\(knockback\\)': '(Rückstoß)',
        '\\(share\\)': '(Teilen)',
        'Bury': 'Impakt',
        'Circles of Pandaemonium': 'Pandaemonischer Ring',
        'Dividing Wings': 'Teilungsstrahl',
        'Daemoniac Bonds': 'Dæmonische Fessel',
        'Entangling Web': 'Großnetz',
        'Harrowing Hell': 'Höllenpein der Tiefe',
        'Jade Passage': 'Jadeweg',
        'Pandaemoniac Meltdown': 'Pandaemonischer Kollaps',
        'Pandaemoniac Pillars': 'Pandaemonische Säule',
        'Pandaemoniac Ray': 'Pandaemonischer Strahl',
        'Pandaemoniac Turrets': 'Pandæmonischer Feuerturm',
        'Pandaemoniac Web': 'Pandæmonisches Netz',
        'Pandaemon\'s Holy': 'Pandaemonisches Sanctus',
        'Parted Plumes': 'Teilungsstrahl',
        'Peal of Condemnation': 'Verdammungsschub',
        'Peal of Damnation': 'Kanone der Verdammnis',
        'Silkspit': 'Spucknetz',
        'Soul Grasp': 'Seelengreifer',
        'Steel Web': 'Schwernetz',
        'Touchdown': 'Himmelssturz',
        'Ultima': 'Ultima',
        'Wicked Step': 'Übler Schritt',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Arcane Sphere': 'sphère arcanique',
        'Pand(?:\\\\u00e6|\u00e6)moniac Pillar': 'pilier pand\u00e6moniaque',
        'Pand(?:\\\\u00e6|\u00e6)monium': 'Pand\u00e6monium',
      },
      'replaceText': {
        'Bury': 'Impact',
        'Circles of Pandaemonium': 'Anneau pandaemoniaque',
        'Dividing Wings': 'Ailes fendantes',
        'Daemoniac Bonds': 'Lien pandæmoniaque',
        'Entangling Web': 'Grande toile',
        'Harrowing Hell': 'Assaut sismique',
        'Jade Passage': 'Sentier de Jade',
        'Pandaemoniac Meltdown': 'Fusion pandaemoniaque',
        'Pandaemoniac Pillars': 'Piliers pandaemoniaques',
        'Pandaemoniac Ray': 'Rayon pandaemoniaque',
        'Pandaemoniac Turrets': 'Tourelles pandæmoniaques',
        'Pandaemoniac Web': 'Toile pandæmoniaque',
        'Pandaemon\'s Holy': 'Miracle pandaemoniaque',
        'Parted Plumes': 'Plumes fendantes',
        'Peal of Condemnation': 'Électrochoc condamnant',
        'Peal of Damnation': 'Électrochoc damnant',
        'Silkspit': 'Crachat de toile',
        'Soul Grasp': 'Saisie d\'âme',
        'Steel Web': 'Toile dense',
        'Touchdown': 'Atterrissage',
        'Ultima': 'Ultima',
        'Wicked Step': 'Pattes effilées',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Arcane Sphere': '立体魔法陣',
        'Pand(?:\\\\u00e6|\u00e6)moniac Pillar': '万魔殿の塔',
        'Pand(?:\\\\u00e6|\u00e6)monium': 'パンデモニウム',
      },
      'replaceText': {
        'Bury': '衝撃',
        'Circles of Pandaemonium': 'パンデモニックリング',
        'Dividing Wings': 'ディバイドウィング',
        'Daemoniac Bonds': 'パンデモニックボンド',
        'Entangling Web': 'グランドウェブ',
        'Harrowing Hell': '魔殿の震撃',
        'Jade Passage': 'ロード・オブ・ジェイド',
        'Pandaemoniac Meltdown': 'パンデモニックメルトン',
        'Pandaemoniac Pillars': 'パンデモニックピラー',
        'Pandaemoniac Ray': 'パンデモニックレイ',
        'Pandaemoniac Turrets': 'パンデモニックタレット',
        'Pandaemoniac Web': 'パンデモニックウェブ',
        'Pandaemon\'s Holy': 'パンデモニックホーリー',
        'Parted Plumes': 'ディバイドプルーム',
        'Peal of Condemnation': 'コンデムブラスター',
        'Peal of Damnation': 'ダムドブラスター',
        'Silkspit': 'スピットウェブ',
        'Soul Grasp': 'ソウルグラスプ',
        'Steel Web': 'ヘビーウェブ',
        'Touchdown': 'タッチダウン',
        'Ultima': 'アルテマ',
        'Wicked Step': '尖脚',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Arcane Sphere': '立体魔法阵',
        'Pand(?:\\\\u00e6|\u00e6)moniac Pillar': '万魔殿之塔',
        'Pand(?:\\\\u00e6|\u00e6)monium': '万魔殿',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(cone\\)': '(锥形)',
        '\\(knockback\\)': '(击退)',
        '\\(share\\)': '(分摊)',
        'Bury': '塌方',
        'Circles of Pandaemonium': '万魔殿之环',
        'Dividing Wings': '分割之翼',
        'Daemoniac Bonds': '万魔殿牢狱',
        'Entangling Web': '纠缠之网',
        'Harrowing Hell': '魔殿震击',
        'Jade Passage': '翡翠通道',
        'Pandaemoniac Meltdown': '万魔殿熔毁',
        'Pandaemoniac Pillars': '万魔殿之柱',
        'Pandaemoniac Ray': '万魔殿射线',
        'Pandaemoniac Turrets': '万魔殿炮塔',
        'Pandaemoniac Web': '万魔殿之网',
        'Pandaemon\'s Holy': '万魔殿神圣',
        'Parted Plumes': '分割之羽',
        'Peal of Condemnation': '谴责冲击波',
        'Peal of Damnation': '诅咒冲击波',
        'Silkspit': '喷吐丝网',
        'Soul Grasp': '攥魂',
        'Steel Web': '沉重之网',
        'Touchdown': '空降',
        'Ultima': '究极',
        'Wicked Step': '尖脚',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Arcane Sphere': '입체마법진',
        'Pand(?:\\\\u00e6|\u00e6)moniac Pillar': '마의 전당 탑',
        'Pand(?:\\\\u00e6|\u00e6)monium': '판데모니움',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(cone\\)': '(부채꼴)',
        '\\(knockback\\)': '(넉백)',
        '\\(share\\)': '(쉐어)',
        'Bury': '충격',
        'Circles of Pandaemonium': '판데모니움 고리',
        'Dividing Wings': '날개 분리',
        'Daemoniac Bonds': '판데모니움 결속',
        'Entangling Web': '거대 거미줄',
        'Harrowing Hell': '판데모니움 격돌',
        'Jade Passage': '제이드 통로',
        'Pandaemoniac Meltdown': '판데모니움 멜튼',
        'Pandaemoniac Pillars': '판데모니움 기둥',
        'Pandaemoniac Ray': '판데모니움 광선',
        'Pandaemoniac Turrets': '판데모니움 포탑',
        'Pandaemoniac Web': '판데모니움 거미줄',
        'Pandaemon\'s Holy': '판데모니움 홀리',
        'Parted Plumes': '깃털 분리',
        'Peal of Condemnation': '형벌 선포',
        'Peal of Damnation': '천벌 선포',
        'Silkspit': '거미줄 뱉기',
        'Soul Grasp': '영혼 장악',
        'Steel Web': '강력 거미줄',
        'Touchdown': '착지',
        'Ultima': '알테마',
        'Wicked Step': '뾰족다리',
      },
    },
  ],
};

export default triggerSet;
