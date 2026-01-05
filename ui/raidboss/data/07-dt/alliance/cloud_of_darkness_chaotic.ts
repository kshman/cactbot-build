import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type ThirdArtOfDarknessId = keyof typeof thirdArtOfDarknessHeadmarker;
type ThirdArtOfDarkness = 'left' | 'right' | 'pair' | 'protean';

const thirdArtOfDarknessHeadmarker = {
  '00EF': 'left',
  '00F0': 'right',
  '00F1': 'pair',
  '00F2': 'protean',
} as const;

const isThirdArtOfDarknessId = (id: string): id is ThirdArtOfDarknessId => {
  return id in thirdArtOfDarknessHeadmarker;
};

export interface Data extends RaidbossData {
  blades: number;
  grim: 'front' | 'back' | 'unknown';
  scast: 'death' | 'aero' | 'unknown';
  type: 'in' | 'out' | 'unknown';
  side?: 'east' | 'west';
  taod: {
    east?: ThirdArtOfDarkness[];
    west?: ThirdArtOfDarkness[];
  };
  targets: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheCloudOfDarknessChaotic',
  zoneId: ZoneId.TheCloudOfDarknessChaotic,
  timelineFile: 'cloud_of_darkness_chaotic.txt',
  initData: () => {
    return {
      blades: 0,
      grim: 'unknown',
      scast: 'unknown',
      type: 'unknown',
      taod: {},
      targets: [],
    };
  },
  timelineTriggers: [],
  triggers: [
    {
      id: 'Cloud Chaotic Doom',
      type: 'GainsEffect',
      netRegex: { effectId: 'D24' },
      condition: (data, matches) => data.CanCleanse() && data.party.inParty(matches.target),
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Cleanse Doom',
          ja: '死の宣告にエスナ',
          ko: '에스나 써줘요!',
        },
      },
    },
    {
      id: 'Cloud Chaotic Tank Swap',
      type: 'GainsEffect',
      netRegex: { effectId: '1122' },
      condition: (data, matches) => {
        if (data.role !== 'tank' || !data.party.inParty(matches.target))
          return false;
        return parseInt(matches.count) >= 5;
      },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.shirk!();
        return output.provoke!();
      },
      outputStrings: {
        provoke: {
          en: 'Provoke',
          ja: 'Provoke',
          ko: '프로보크!',
        },
        shirk: {
          en: 'Shirk',
          ja: 'Shirk',
          ko: '셔크 날려요!',
        },
      },
    },
    {
      id: 'Cloud Chaotic Blade of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9DFB', '9DFD', '9DFF'], source: 'Cloud of Darkness' },
      durationSeconds: (data) => data.scast === 'unknown' ? 5 : 8,
      infoText: (data, matches, output) => {
        const action = matches.id === '9DFB' ? 'right' : matches.id === '9DFD' ? 'left' : 'out';
        const mesg = output[action]!();
        if (data.scast === 'unknown')
          return mesg;
        const scast = output[data.scast]!();
        data.scast = 'unknown';
        return output.combo!({ action: mesg, scast: scast });
      },
      outputStrings: {
        combo: {
          en: '${action} => ${scast}',
          ja: '${action} => ${scast}',
          ko: '${action} 🔜 ${scast}',
        },
        out: Outputs.out,
        left: Outputs.getLeftAndWest,
        right: Outputs.getRightAndEast,
        death: Outputs.outThenIn,
        aero: Outputs.knockback,
      },
    },
    {
      id: 'Cloud Chaotic Deluge of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E3D', '9E01'], source: 'Cloud of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.bleedAoe(),
      run: (data) => data.targets = [],
    },
    {
      id: 'Cloud Chaotic Grim Tether',
      type: 'Tether',
      netRegex: { id: ['012C', '012D'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      infoText: (data, matches, output) => {
        if (matches.id === '012C') {
          data.grim = 'back';
          return output.back!();
        }
        data.grim = 'front';
        return output.front!();
      },
      outputStrings: {
        front: {
          en: '(Move forward, later)',
          ja: '(Move forward, later)',
          ko: '(앞에서 주먹 🔜 앞으로)',
        },
        back: {
          en: '(Move backward, later)',
          ja: '(Move backward, later)',
          ko: '(뒤에서 주먹 🔜 뒤로)',
        },
      },
    },
    {
      id: 'Cloud Chaotic Deadly Embrace',
      type: 'GainsEffect',
      netRegex: { effectId: '1055' }, // _rsv_4181_-1_1_0_0_S74CFC3B0_E74CFC3B0
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      countdownSeconds: 5.5,
      infoText: (data, _matches, output) => output[data.grim]!(),
      outputStrings: {
        front: {
          en: '(Forward soon)',
          ja: '(Forward soon)',
          ko: '(곧 앞으로, 보스 봐요)',
        },
        back: {
          en: '(Backward soon)',
          ja: '(Backward soon)',
          ko: '(곧 뒤로, 벽 봐요)',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic Deadly Embrace Move',
      type: 'GainsEffect',
      netRegex: { effectId: '1055' }, // _rsv_4181_-1_1_0_0_S74CFC3B0_E74CFC3B0
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      durationSeconds: 1.5,
      alarmText: (data, _matches, output) => output[data.grim]!(),
      outputStrings: {
        front: {
          en: 'Move forward!',
          ja: 'Move forward!',
          ko: '앞으로!',
        },
        back: {
          en: 'Move backward!',
          ja: 'Move backward!',
          ko: '뒤로!',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic Rapid-sequence Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E40', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Charge beams',
          ja: 'Charge beams',
          ko: '연속 레이저',
        },
      },
    },
    {
      id: 'Cloud Chaotic Unholy Darkness',
      type: 'StartsUsing',
      netRegex: { id: 'A12D', source: 'Cloud of Darkness', capture: false },
      response: Responses.healerGroups(),
    },
    {
      id: 'Cloud Chaotic Flare Marker',
      type: 'HeadMarker',
      netRegex: { id: '015A' },
      condition: (data, matches) => {
        data.targets.push(matches.target);
        return data.targets.length === 3;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          flare: {
            en: 'Flare on YOU',
            ko: '내게 플레어!',
          },
          none: {
            en: 'No Flare',
            ko: '플레어 피해욧',
          },
        };
        if (data.targets.includes(data.me))
          return { alertText: output.flare!() };
        return { infoText: output.none!() };
      },
    },
    {
      id: 'Cloud Chaotic Break IV',
      type: 'StartsUsing',
      netRegex: { id: '9E4F', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 3,
      response: Responses.lookAway(),
    },
    {
      id: 'Cloud Chaotic Endeath IV', // _rsv_40531_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E53', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.scast = 'death',
    },
    {
      id: 'Cloud Chaotic Enaero IV', // _rsv_40532_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E54', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.scast = 'aero',
    },
    {
      id: 'Cloud Chaotic Death IV', // _rsv_40515_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E43', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 4,
      response: Responses.getOutThenIn(),
    },
    {
      id: 'Cloud Chaotic Aero IV', // _rsv_40524_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E4C', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 4,
      response: Responses.knockback(),
    },
    {
      id: 'Cloud Chaotic Flood of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E3E', '9E07'], source: 'Cloud of Darkness', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cloud Chaotic Darkness Gain',
      type: 'GainsEffect',
      netRegex: { effectId: ['1051', '1052'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.type = matches.effectId === '1051' ? 'in' : 'out',
    },
    {
      id: 'Cloud Chaotic Darkness Lose',
      type: 'LosesEffect',
      netRegex: { effectId: ['1051', '1052'] },
      condition: Conditions.targetIsYou(),
      run: (data) => data.type = 'unknown',
    },
    {
      id: 'Cloud Chaotic Dark Dominion',
      type: 'StartsUsing',
      netRegex: { id: '9E08', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'Cloud Chaotic Side Detector',
      type: 'Ability',
      netRegex: { id: ['9E08', '9E2E'], capture: false },
      suppressSeconds: 1,
      promise: async (data) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;
        const me = actors.find((actor) => actor.Name === data.me);
        if (!me) {
          console.error(`위치 확인: 나는 어디에? (${data.me})`);
        } else {
          data.side = me.PosX < 100 ? 'east' : 'west';
        }
      },
    },
    {
      id: 'Cloud Chaotic Atomos Spawn',
      type: 'AddedCombatant',
      // 13626 = Atomos
      netRegex: { npcNameId: '13626', capture: false },
      suppressSeconds: 1,
      response: Responses.killAdds(),
    },
    {
      id: 'Cloud Chaotic Particle Concentration',
      type: 'Ability',
      netRegex: { id: '9E18', source: 'Cloud Of Darkness', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Towers',
          ja: 'Get Towers',
          ko: '타워 밟아요!',
        },
      },
    },
    {
      id: 'Cloud Chaotic Ghastly Gloom',
      type: 'StartsUsing',
      netRegex: { id: ['9E09', '9E0B'], source: 'Cloud of Darkness' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => matches.id === '9E09' ? output.out!() : output.in!(),
      outputStrings: {
        in: {
          en: 'In',
          ja: 'In',
          ko: '도넛, 안으로!',
        },
        out: {
          en: 'Out',
          ja: 'Out',
          ko: '십자, 모서리로!',
        },
      },
    },
    {
      id: 'Cloud Chaotic Flood of Darkness Interrupt',
      type: 'StartsUsing',
      netRegex: { id: '9E37', source: 'Stygian Shadow' },
      condition: (data, matches) => {
        const pos = parseFloat(matches.x) < 100 ? 'east' : 'west';
        return data.type === 'out' && data.side === pos;
      },
      suppressSeconds: 1,
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'Cloud Chaotic Chaos-condensed Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E0D', source: 'Cloud of Darkness', capture: false },
      response: Responses.stackMarker(),
    },
    {
      id: 'Cloud Chaotic Diffusive-force Particle Beam', // _rsv_40464_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E10', source: 'Cloud of Darkness', capture: false },
      response: Responses.spread('alert'),
    },
    {
      id: 'Cloud Chaotic Active-pivot Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: ['9E13', '9E15'], source: 'Cloud of Darkness' },
      infoText: (_data, matches, output) => matches.id === '9E13' ? output.cw!() : output.ccw!(),
      outputStrings: {
        cw: Outputs.clockwise,
        ccw: Outputs.counterclockwise,
      },
    },
    {
      id: 'Cloud Chaotic Curse Of Darkness AoE',
      type: 'StartsUsing',
      netRegex: { id: '9E33', source: 'Stygian Shadow', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cloud Chaotic Curse Of Darkness Face Laser',
      type: 'GainsEffect',
      netRegex: { effectId: '953' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Beam',
          ja: 'Beam',
          ko: '바깥 봐요!',
        },
      },
    },
    {
      id: 'Cloud Chaotic Excruciate',
      type: 'StartsUsing',
      netRegex: { id: '9E36', source: 'Stygian Shadow' },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        return data.me === matches.target || (data.type === 'out' && data.side === side);
      },
      response: Responses.tankCleave(),
    },
    {
      id: 'Cloud Chaotic Core-lateral Phaser 9E2F',
      type: 'StartsUsing',
      netRegex: { id: '9E2F', source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        return data.type === 'out' && data.side === side;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => middle',
          ja: 'サイド => 真ん中',
          ko: '옆에 있다 🔜 가운데로',
        },
      },
    },
    {
      id: 'Cloud Chaotic Lateral-core Phaser 9E30',
      type: 'StartsUsing',
      netRegex: { id: '9E30', source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        return data.type === 'out' && data.side === side;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Middle => sides',
          ja: '真ん中 => サイド',
          ko: '가운데 있다 🔜 옆으로',
        },
      },
    },
    {
      id: 'Cloud Chaotic Evil Seed',
      type: 'HeadMarker',
      netRegex: { id: '0227' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Place Bramble',
          ja: 'Place Bramble',
          ko: '씨앗 장판 버려요',
        },
      },
    },
    {
      id: 'Cloud Chaotic Thorny Vine',
      type: 'GainsEffect',
      netRegex: { effectId: '1BD' },
      condition: Conditions.targetIsYou(),
      response: Responses.breakChains(),
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness Collector',
      type: 'HeadMarker',
      netRegex: {
        id: Object.keys(thirdArtOfDarknessHeadmarker),
        target: 'Stygian Shadow',
        capture: true,
      },
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;

        const actorID = parseInt(matches.targetId, 16);
        const actor = actors.find((actor) => actor.ID === actorID);

        if (!actor) {
          console.error(
            `Cloud Chaotic The Third Art of Darkness Collector: can't find actor ${actorID}`,
          );
          return;
        }

        if (!isThirdArtOfDarknessId(matches.id)) {
          throw new UnreachableCode();
        }

        const side = actor.PosX < 100 ? 'east' : 'west';
        const mech = thirdArtOfDarknessHeadmarker[matches.id];

        if (side === 'east') {
          (data.taod.east ??= []).push(mech);
        } else {
          (data.taod.west ??= []).push(mech);
        }
      },
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness Initial',
      type: 'StartsUsing',
      netRegex: { id: ['9E20', '9E23'], source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        return data.type === 'out' && side === data.side;
      },
      // delay enough to capture the first mechanic telegraph
      delaySeconds: 2,
      infoText: (data, matches, output) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        const shadowData = side === 'east'
          ? data.taod.east
          : data.taod.west;

        if (!shadowData) {
          console.error(
            `Cloud Chaotic The Third Art of Darkness Initial: missing shadowData for side ${side}`,
          );
        }

        const [mech1] = shadowData ?? [];

        return output.text!({
          first: mech1 === undefined ? output.unknown!() : output[mech1]!(),
        });
      },
      outputStrings: {
        text: {
          en: 'Start ${first}',
          ja: '最初は ${first} から',
          ko: '시작: ${first}',
        },
        left: Outputs.right,
        right: Outputs.left,
        pair: Outputs.stackPartner,
        protean: Outputs.protean,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E20', '9E23'], source: 'Stygian Shadow', capture: true },
      condition: (data, matches) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        return data.type === 'out' && side === data.side;
      },
      // the adds take a long time to telegraph all of their upcoming mechanics
      delaySeconds: 7.5,
      alertText: (data, matches, output) => {
        const side = parseFloat(matches.x) < 100 ? 'east' : 'west';
        const shadowData = side === 'east'
          ? data.taod.east
          : data.taod.west;

        if (!shadowData) {
          console.error(
            `Cloud Chaotic The Third Art of Darkness: missing shadowData for side ${side}`,
          );
        }

        const [mech1, mech2, mech3] = shadowData ?? [];

        return output.text!({
          first: mech1 === undefined ? output.unknown!() : output[mech1]!(),
          second: mech2 === undefined ? output.unknown!() : output[mech2]!(),
          third: mech3 === undefined ? output.unknown!() : output[mech3]!(),
        });
      },
      outputStrings: {
        text: {
          en: '${first} => ${second} => ${third}',
          ja: '${first} => ${second} => ${third}',
          ko: '${first} 🔜 ${second} 🔜 ${third}',
        },
        left: Outputs.right,
        right: Outputs.left,
        pair: Outputs.stackPartner,
        protean: Outputs.protean,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Cloud Chaotic The Third Art of Darkness Cleanup',
      type: 'Ability',
      netRegex: { id: ['9E20', '9E23'], source: 'Stygian Shadow', capture: false },
      suppressSeconds: 1,
      run: (data) => {
        delete data.taod.east;
        delete data.taod.west;
      },
    },
    {
      id: 'Cloud Chaotic Looming Chaos',
      type: 'StartsUsing',
      netRegex: { id: 'A2CB', source: 'Cloud of Darkness', capture: false },
      condition: (data) => data.type === 'out',
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => delete data.side,
      outputStrings: {
        text: {
          en: 'Align',
          ja: 'Align',
          ko: '자리 정렬, 줄 준비',
        },
      },
    },
    {
      id: 'Cloud Chaotic Feint Particle Beam',
      type: 'HeadMarker',
      netRegex: { id: '00C5' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chasing AoE on YOU',
          ja: '追跡AOE',
          ko: '내게 장판이 따라와요! 돌아요!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Cloud Of Darkness': 'Wolke der Dunkelheit',
        'Cloud of Darkness': 'Wolke der Dunkelheit',
        'Cloudlet of Darkness': 'Zirrus der Dunkelheit',
        'Stygian Shadow': 'abyssisch(?:e|er|es|en) Abscheulichkeit',
      },
      'replaceText': {
        '--adds untargetable--': '--add nicht anvisierbar--',
        'Active-pivot Particle Beam': 'Rotierender Partikelstrahl',
        '(?<!En)Aero IV': 'Windka',
        'Blade of Darkness': 'Schwarze Schneide',
        'Break IV': 'Stillstandka',
        'Chaos-condensed Particle Beam': 'Hyperdichter Partikelstrahl',
        'Core-lateral Phaser': 'Zentral-Lateral-Phaser',
        'Curse of Darkness': 'Partikelfluch',
        'Dark Dominion': 'Dunkle Herrschaft',
        'Dark-energy Particle Beam': 'Dunkler Partikelstrahl',
        '(?<!En)Death IV': 'Todka',
        'Deluge of Darkness': 'Sintflut der Dunkelheit',
        'Diffusive-force Particle Beam': 'Diffusiver Partikelstrahl',
        'Enaero IV': 'Adwindka',
        'Endeath IV': 'Adtodka',
        'Evaporation': 'Verflüchtigung',
        'Evil Seed': 'Saatkugel',
        'Excruciate': 'Kreuzigung',
        'Feint Particle Beam': 'Schein-Partikelstrahl',
        'Flare': 'Flare',
        'Flood of Darkness': 'Dunkle Flut',
        'Ghastly Gloom': 'Schaurige Schwärze',
        'Grim Embrace': 'Grimmige Umarmung',
        'Lateral-core Phaser': 'Lateral-Zentral-Phaser',
        'Looming Chaos': 'Aufziehendes Chaos',
        '(?<! )Particle Beam': 'Partikeldetonation',
        'Particle Concentration': 'Partikelkugel',
        '(?<! )Phaser': 'Phaser',
        'Rapid-sequence Particle Beam': 'Dauerfeuer-Partikelstrahl',
        'Razing-volley Particle Beam': 'Salvenfeuer-Partikelstrahl',
        'Thorny Vine': 'Dornenranken',
        'Unholy Darkness': 'Unheiliges Dunkel',
        'Vortex': 'Einsaugen',
        'the Third Art of Darkness': 'Dunkle Taktik: Dreifach',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Cloud of Darkness': 'Nuage de Ténèbres',
        'Cloudlet of Darkness': 'stratus de Ténèbres',
        'Stygian Shadow': 'suppôt de Ténèbres',
      },
      'replaceText': {
        'Active-pivot Particle Beam': 'Canon plasma rotatif',
        '(?<!En)Aero IV': 'Giga Vent',
        'Blade of Darkness': 'Ténèbres acérées',
        'Break IV': 'Giga Brèche',
        'Chaos-condensed Particle Beam': 'Canon plasma hyperconcentré',
        'Core-lateral Phaser': 'Faisceaux centrés et latéraux',
        'Curse of Darkness': 'Malédiction particulaire',
        'Dark Dominion': 'Domaines obscurs',
        'Dark-energy Particle Beam': 'Faisceau de particules maudit',
        '(?<!En)Death IV': 'Giga Mort',
        'Deluge of Darkness': 'Grand déluge de Ténèbres',
        'Diffusive-force Particle Beam': 'Canon plasma diffus',
        'Enaero IV': 'Onction : Giga Vent',
        'Endeath IV': 'Onction : Giga Mort',
        'Evaporation': 'Évaporation',
        'Evil Seed': 'Tir semant',
        'Excruciate': 'Empalement ténébreux',
        'Feint Particle Beam': 'Rayon pénétrant',
        'Flare': 'Brasier',
        'Flood of Darkness': 'Déluge de Ténèbres',
        'Ghastly Gloom': 'Nuée calorifique',
        'Grim Embrace': 'Étreinte funèbre',
        'Lateral-core Phaser': 'Faisceaux latéraux et centrés',
        'Looming Chaos': 'Chaos rampant',
        '(?<! )Particle Beam': 'Rayon explosif',
        'Particle Concentration': 'Rayon sphérique',
        '(?<! )Phaser': 'Faisceau de particules bondissant',
        'Rapid-sequence Particle Beam': 'Rafale plasmique',
        'Razing-volley Particle Beam': 'Salve plasmique',
        'Thorny Vine': 'Sarment de ronces',
        'Unholy Darkness': 'Miracle ténébreux',
        'Vortex': 'Aspiration',
        'the Third Art of Darkness': 'Arts ténébreux triple',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Cloud of Darkness': '暗闇の雲',
        'Cloudlet of Darkness': '暗闇の片乱雲',
        'Stygian Shadow': '闇より出づる者',
      },
      'replaceText': {
        'Active-pivot Particle Beam': '旋回式波動砲',
        '(?<!En)Aero IV': 'エアロジャ',
        'Blade of Darkness': '闇の刃',
        'Break IV': 'ブレクジャ',
        'Chaos-condensed Particle Beam': '凝縮式波動砲',
        'Core-lateral Phaser': '跳躍波動砲【正撃・側撃】',
        'Curse of Darkness': '波動の呪詛',
        'Dark Dominion': '深闇領域',
        'Dark-energy Particle Beam': '呪詛式 波動砲',
        '(?<!En)Death IV': 'デスジャ',
        'Deluge of Darkness': '闇の大氾濫',
        'Diffusive-force Particle Beam': '分散式波動砲',
        'Enaero IV': 'エンエアロジャ',
        'Endeath IV': 'エンデスジャ',
        'Evaporation': '雲散',
        'Evil Seed': '種子弾',
        'Excruciate': '磔殺',
        'Feint Particle Beam': '潜地式波動砲',
        'Flare': 'フレア',
        'Flood of Darkness': '闇の氾濫',
        'Ghastly Gloom': '怖れの雲',
        'Grim Embrace': 'グリムエンブレイス',
        'Lateral-core Phaser': '跳躍波動砲【側撃・正撃】',
        'Looming Chaos': 'ルーミングカオス',
        '(?<! )Particle Beam': '波動爆発',
        'Particle Concentration': '波動球',
        '(?<! )Phaser': '跳躍波動砲',
        'Rapid-sequence Particle Beam': '連射式波動砲',
        'Razing-volley Particle Beam': '斉射式波動砲',
        'Thorny Vine': '茨の蔓',
        'Unholy Darkness': 'ダークホーリー',
        'Vortex': '吸引',
        'the Third Art of Darkness': '闇の戦技：三重',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Cloud Of Darkness': '暗黑之云',
        'Cloud of Darkness': '暗黑之云',
        'Cloudlet of Darkness': '暗黑之破片云',
        'Stygian Shadow': '生于黑暗之物',
      },
      'replaceText': {
        '--adds untargetable--': '--小怪不可选中--',
        'Active-pivot Particle Beam': '回旋式波动炮',
        '(?<!En)Aero IV': '飙风',
        'Blade of Darkness': '暗之刃',
        'Break IV': '超石化',
        'Chaos-condensed Particle Beam': '凝聚式波动炮',
        'Core-lateral Phaser': '正侧跳跃波动炮',
        'Curse of Darkness': '波动诅咒',
        'Dark Dominion': '深暗领域',
        'Dark-energy Particle Beam': '诅咒式波动炮',
        '(?<!En)Death IV': '极死',
        'Deluge of Darkness': '暗之大泛滥',
        'Diffusive-force Particle Beam': '分散式波动炮',
        'Enaero IV': '超附风',
        'Endeath IV': '超附死',
        'Evaporation': '云散',
        'Evil Seed': '种子弹',
        'Excruciate': '磔杀',
        'Feint Particle Beam': '潜地式波动炮',
        'Flare': '核爆',
        'Flood of Darkness': '暗之泛滥',
        'Ghastly Gloom': '恐惧之云',
        'Grim Embrace': '阴冷拥抱',
        'Lateral-core Phaser': '侧正跳跃波动炮',
        'Looming Chaos': '混沌迫近',
        '(?<! )Particle Beam': '波动爆炸',
        'Particle Concentration': '波动球',
        '(?<! )Phaser': '跳跃波动炮',
        'Rapid-sequence Particle Beam': '连射式波动炮',
        'Razing-volley Particle Beam': '齐射式波动炮',
        'Thorny Vine': '荆棘丛生',
        'Unholy Darkness': '黑暗神圣',
        'Vortex': '吸引',
        'the Third Art of Darkness': '三重暗之战技',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Cloud Of Darkness': '黑暗之雲',
        'Cloud of Darkness': '黑暗之雲',
        // 'Cloudlet of Darkness': '', // FIXME '暗黑之破片云'
        // 'Stygian Shadow': '', // FIXME '生于黑暗之物'
      },
      'replaceText': {
        // '--adds untargetable--': '', // FIXME '--小怪不可选中--'
        // 'Active-pivot Particle Beam': '', // FIXME '回旋式波动炮'
        '(?<!En)Aero IV': '超勁風',
        // 'Blade of Darkness': '', // FIXME '暗之刃'
        // 'Break IV': '', // FIXME '超石化'
        // 'Chaos-condensed Particle Beam': '', // FIXME '凝聚式波动炮'
        // 'Core-lateral Phaser': '', // FIXME '正侧跳跃波动炮'
        // 'Curse of Darkness': '', // FIXME '波动诅咒'
        // 'Dark Dominion': '', // FIXME '深暗领域'
        'Dark-energy Particle Beam': '詛咒式波動砲',
        // '(?<!En)Death IV': '', // FIXME '极死'
        'Deluge of Darkness': '暗之大氾濫',
        // 'Diffusive-force Particle Beam': '', // FIXME '分散式波动炮'
        // 'Enaero IV': '', // FIXME '超附风'
        // 'Endeath IV': '', // FIXME '超附死'
        // 'Evaporation': '', // FIXME '云散'
        'Evil Seed': '種子彈',
        // 'Excruciate': '', // FIXME '磔杀'
        'Feint Particle Beam': '潛地式波動砲',
        'Flare': '火光',
        // 'Flood of Darkness': '', // FIXME '暗之泛滥'
        // 'Ghastly Gloom': '', // FIXME '恐惧之云'
        // 'Grim Embrace': '', // FIXME '阴冷拥抱'
        // 'Lateral-core Phaser': '', // FIXME '侧正跳跃波动炮'
        // 'Looming Chaos': '', // FIXME '混沌迫近'
        '(?<! )Particle Beam': '波動爆炸',
        'Particle Concentration': '波動球',
        // '(?<! )Phaser': '', // FIXME '跳跃波动炮'
        // 'Rapid-sequence Particle Beam': '', // FIXME '连射式波动炮'
        // 'Razing-volley Particle Beam': '', // FIXME '齐射式波动炮'
        'Thorny Vine': '荊棘叢生',
        'Unholy Darkness': '黑暗神聖',
        'Vortex': '吸引',
        'the Third Art of Darkness': '三重暗之戰技',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Cloud Of Darkness': '어둠의 구름',
        'Cloud of Darkness': '어둠의 구름',
        'Cloudlet of Darkness': '어둠의 조각구름',
        'Stygian Shadow': '어둠에서 나타난 자',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(damage\\)': '(피해)',
        '\\(brambles drop\\)': '(장판 떨어짐)',
        '\\(chasing AoEs\\)': '(추적 장판)',
        '--adds untargetable--': '--쫄 타겟불가능--',
        'Active-pivot Particle Beam': '선회식 파동포',
        '(?<!En)Aero IV': '에어로쟈',
        'Blade of Darkness': '어둠의 칼날',
        'Break IV': '브레크쟈',
        'Chaos-condensed Particle Beam': '응축식 파동포',
        'Core-lateral Phaser': '도약파동포: 정면 측면',
        'Curse of Darkness': '파동의 저주',
        'Dark Dominion': '짙은 어둠의 영역',
        'Dark-energy Particle Beam': '저주식 파동포',
        '(?<!En)Death IV': '데스쟈',
        'Deluge of Darkness': '어둠의 대범람',
        'Diffusive-force Particle Beam': '분산식 파동포',
        'Enaero IV': '인에어로쟈',
        'Endeath IV': '인데스쟈',
        'Evaporation': '흩어지는 구름',
        'Evil Seed': '씨앗탄',
        'Excruciate': '책살',
        'Feint Particle Beam': '위장형 파동포',
        'Flare': '플레어',
        'Flood of Darkness': '어둠의 범람',
        'Ghastly Gloom': '공포의 구름',
        'Grim Embrace': '음산한 포옹',
        'Lateral-core Phaser': '도약파동포: 측면 정면',
        'Looming Chaos': '다가오는 혼돈',
        '(?<! )Particle Beam': '파동 폭발',
        'Particle Concentration': '파동구',
        '(?<! )Phaser': '도약파동포',
        'Rapid-sequence Particle Beam': '연사식 파동포',
        'Razing-volley Particle Beam': '일제 사격식 파동포',
        'Thorny Vine': '가시덩굴',
        'Unholy Darkness': '다크 홀리',
        'Vortex': '흡인',
        'the Third Art of Darkness': '어둠의 전투술: 삼중',
      },
    },
  ],
};

export default triggerSet;
