import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  lightfastCount?: number;
  alliance?: 'A' | 'B' | 'C';
}

// The Copied Factory
// TODO: Tell people where to stand for Engels wall saws
// TODO: Tell people where to stand for 9S overhead saws
// TODO: Tell people where to go for 9S divebombs
// TODO: Tell people where to go for 9S tethered tank

const triggerSet: TriggerSet<Data> = {
  id: 'TheCopiedFactory',
  zoneId: ZoneId.TheCopiedFactory,
  timelineFile: 'the_copied_factory.txt',
  timelineTriggers: [
    {
      id: 'Copied Flight Unit Lightfast',
      regex: /Lightfast Blade/,
      beforeSeconds: 15,
      infoText: (data, _matches, output) => {
        // The third lightfast blade comes very close to second,
        // so suppress its message.
        data.lightfastCount = (data.lightfastCount ?? 0) + 1;
        if (data.lightfastCount !== 3)
          return;
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Be Near Boss',
          de: 'sei in der Nähe des Bosses',
          fr: 'Placez-vous près du boss',
          ja: 'ボスに貼りつく',
          cn: '靠近Boss',
          ko: '보스 가까이',
        },
      },
    },
    {
      id: 'Copied Engels Demolish Structure',
      regex: /Demolish Structure/,
      beforeSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move to South Edge',
          de: 'zur südlichen Kante',
          fr: 'Allez vers le bord sud',
          ja: '南へ',
          cn: '前往南侧边缘',
          ko: '남쪽 구석으로',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'Copied Serial Forceful Impact',
      type: 'StartsUsing',
      netRegex: { id: '48CF', source: 'Serial-Jointed Command Model', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Copied Serial Energy Assault',
      type: 'StartsUsing',
      netRegex: { id: '48B5', source: 'Serial-Jointed Command Model', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Copied Serial High-Caliber Laser',
      type: 'StartsUsing',
      netRegex: { id: '48FA', source: 'Serial-Jointed Service Model', capture: false },
      suppressSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Look for Lasers',
          de: 'Pass auf die Laser auf',
          fr: 'Repérez les lasers',
          ja: 'レーザーを避ける',
          cn: '小心激光',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'Copied Serial Clanging Blow',
      type: 'StartsUsing',
      netRegex: { id: '48CE', source: 'Serial-Jointed Command Model' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Copied Serial Centrifugal Spin',
      type: 'StartsUsing',
      netRegex: { id: '48C8', source: 'Serial-Jointed Command Model', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Copied Serial Sidestriking Spin',
      type: 'StartsUsing',
      netRegex: { id: '48CA', source: 'Serial-Jointed Command Model', capture: false },
      response: Responses.goFrontBack(),
    },
    {
      id: 'Copied Serial Shockwave',
      type: 'StartsUsing',
      netRegex: { id: '48C3', source: 'Serial-Jointed Command Model', capture: false },
      response: Responses.knockback('info'),
    },
    {
      id: 'Copied Hobbes Laser-Resistance Test',
      type: 'StartsUsing',
      netRegex: { id: '4805', source: 'Hobbes', capture: false },
      response: Responses.aoe(),
    },
    // https://xivapi.com/LogMessage/9533
    // en: The wall-mounted right arm begins to move...
    {
      id: 'Copied Hobbes Right Arm',
      type: 'SystemLogMessage',
      netRegex: { id: '253D', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.alliance ??= 'A',
      outputStrings: {
        text: {
          en: 'Dodge Moving Circle',
          de: 'Bewegenden Kreisen ausweichen',
          fr: 'Esquivez les cercles mouvants',
          ja: '動いてるサークルを避ける',
          cn: '躲避移动圆圈',
          ko: '움직이는 동글 피해요',
        },
      },
    },
    // https://xivapi.com/LogMessage/9531
    // en: The wall-mounted flamethrowers activate.
    {
      id: 'Copied Hobbes Flamethrowers',
      type: 'SystemLogMessage',
      netRegex: { id: '253B', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.alliance ??= 'B',
      outputStrings: {
        text: {
          en: 'Look Behind For Flamethrowers',
          de: 'Flammenwerfer hinter dir',
          fr: 'Repérez les lance-flammes derrière',
          ja: '後ろに火炎放射器',
          cn: '观察后方放火',
          ko: '뒷쪽 화염방사 피해요',
        },
      },
    },
    // https://xivapi.com/LogMessage/9532
    // en: The wall-mounted left arm begins to move...
    {
      id: 'Copied Hobbes Left Arm 1',
      type: 'SystemLogMessage',
      netRegex: { id: '253C', capture: false },
      durationSeconds: 6,
      response: Responses.getOut('info'),
      run: (data) => data.alliance ??= 'C',
    },
    {
      id: 'Copied Hobbes Left Arm 2',
      type: 'SystemLogMessage',
      netRegex: { id: '253C', capture: false },
      delaySeconds: 8,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dodge Falling Walls',
          de: 'Den fallenden Wände asuweichen',
          fr: 'Esquivez les murs tombants',
          ja: '倒れてくる壁を避ける',
          cn: '躲避倒塌墙壁',
          ko: '넘어지는 벽 피해요',
        },
      },
    },
    {
      id: 'Copied Hobbes Left Arm 3',
      type: 'SystemLogMessage',
      netRegex: { id: '253C', capture: false },
      delaySeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: { // In fact mostly Tank takes all tethers.
          en: 'Spread Tethers',
          de: 'Verbindungen Verteilen',
          fr: 'Dispersez les liens',
          ja: '線を重ならないように散開',
          cn: '散开扯断连线',
          ko: '줄! 이건 탱크 혼자 처리',
        },
      },
    },
    {
      id: 'Copied Hobbes Short Missile',
      type: 'HeadMarker',
      netRegex: { id: '00C4' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread('alert'),
    },
    {
      id: 'Copied Hobbes Laser Sight',
      type: 'StartsUsing',
      netRegex: { id: '4807', source: 'Hobbes', capture: false },
      response: Responses.stackMarker(),
    },
    // https://xivapi.com/LogMessage/9528
    // en: You hear frenzied movement from machines beneath...
    {
      id: 'Copied Hobbes Electric Floor',
      type: 'SystemLogMessage',
      netRegex: { id: '2538', capture: false },
      durationSeconds: 10,
      suppressSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dodge Electric Floor',
          de: 'Elektrischem Boden ausweichen',
          fr: 'Esquivez le sol électrifié',
          ja: '電気床を避ける',
          cn: '躲避带电地板',
          ko: '전기 바닥 피해요',
        },
      },
    },
    // https://xivapi.com/LogMessage/9529
    // en: The conveyer belts whirr to life!
    {
      id: 'Copied Hobbes Conveyer Belts',
      type: 'SystemLogMessage',
      netRegex: { id: '2539', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Conveyor Belts',
          de: 'Förderbänder',
          fr: 'Tapis roulant',
          ja: 'ローラーコンベア',
          cn: '输送带',
          ko: '컨베이어 벨트',
        },
      },
    },
    // https://xivapi.com/LogMessage/9530
    // en: Flammable oil is leaking from the floor...
    {
      id: 'Copied Hobbes Oil 1',
      type: 'SystemLogMessage',
      netRegex: { id: '253A', capture: false },
      durationSeconds: 3,
      suppressSeconds: 15,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Oil Vats',
          de: 'Ölbehälter',
          fr: 'Cuves à huile',
          ja: 'オイルが沸く',
          cn: '油桶',
          ko: '기름이 끓어요',
        },
      },
    },
    {
      id: 'Copied Hobbes Oil 2',
      type: 'SystemLogMessage',
      netRegex: { id: '253A', capture: false },
      delaySeconds: 6,
      durationSeconds: 3,
      suppressSeconds: 15,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Oil Vats',
          de: 'Ölbehälter',
          fr: 'Cuves à huile',
          ja: 'オイルが沸く',
          cn: '油桶',
          ko: '기름이 끓어요',
        },
      },
    },
    {
      id: 'Copied Goliath Tank Exploder',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Medium Exploder' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Exploder on YOU',
          de: 'Explosion auf DIR',
          fr: 'Explosion sur VOUS',
          ja: '自分に自爆',
          cn: '自爆点名',
          ko: '내게 폭발',
        },
      },
    },
    {
      id: 'Copied Flight Unit 360 Bombing Manuever',
      type: 'StartsUsing',
      netRegex: { id: '4941', source: 'Flight Unit', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Copied Flight Unit Ballistic Impact',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread('alert'),
    },
    {
      id: 'Copied Engels Marx Smash Right',
      type: 'StartsUsing',
      netRegex: { id: '4727', source: 'Engels', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Copied Engels Marx Smash Left',
      type: 'StartsUsing',
      netRegex: { id: '4726', source: 'Engels', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Copied Engels Marx Smash Forward',
      type: 'StartsUsing',
      netRegex: { id: '472E', source: 'Engels', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Front and Center',
          de: 'Vorne und Mitte',
          fr: 'Devant et au centre',
          ja: '前方の中へ',
          cn: '前方中间',
          ko: '앞쪽 가운데로',
        },
      },
    },
    {
      id: 'Copied Engels Marx Smash Back',
      type: 'StartsUsing',
      netRegex: { id: '472A', source: 'Engels', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Back and Sides',
          de: 'Hinten und Seiten',
          fr: 'Derrière et sur les côtés',
          ja: '後方の横へ',
          cn: '后方两侧',
          ko: '뒤쪽 옆으로',
        },
      },
    },
    {
      id: 'Copied Engels Marx Crush',
      type: 'StartsUsing',
      netRegex: { id: '4746', source: 'Engels', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill Claws',
          de: 'Klauen töten',
          fr: 'Tuez les pinces',
          ja: 'マルクスを倒す',
          cn: '杀掉爪子',
          ko: '마르크스 잡아요',
        },
      },
    },
    {
      id: 'Copied Engels Precision Guided Missile',
      type: 'HeadMarker',
      netRegex: { id: '00C6' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster('info'),
    },
    {
      id: 'Copied Engels Diffuse Laser',
      type: 'StartsUsing',
      netRegex: { id: '4755', source: 'Engels', capture: false },
      response: Responses.aoe(),
    },
    {
      // Technicallly this is Laser Sight 473A, but energy barrage
      // always precedes it and is an earlier warning.
      // Also suggest going to the front for towers.
      id: 'Copied Engels Energy Barrage 1',
      type: 'StartsUsing',
      netRegex: { id: '473C', source: 'Engels', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Sides (Near Front)',
          de: 'Zu den Seiten (Nahe der Front)',
          fr: 'Allez sur les côtés (vers l\'avant)',
          ja: '横へ (前に近づく)',
          cn: '两侧（靠近前方）',
          ko: '옆으로 (조금 앞쪽에서)',
        },
      },
    },
    {
      id: 'Copied Engels Energy Barrage',
      type: 'StartsUsing',
      netRegex: { id: '473C', source: 'Engels', capture: false },
      delaySeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Towers',
          de: 'Türme nehmen',
          fr: 'Prenez les tours',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '타워 밟아요',
        },
      },
    },
    {
      id: 'Copied Engels Incendiary Bombing',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Puddle on YOU',
          de: 'Fläche auf dir',
          fr: 'Zone au sol sur VOUS',
          ja: '自分に水溜り',
          cn: '水圈点名',
          ko: '내게 물 장판',
        },
      },
    },
    {
      id: 'Copied Engels Guided Missile',
      type: 'HeadMarker',
      netRegex: { id: '00C5' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Out + Dodge Homing AoE',
          de: 'Geh Raus + Zielsuch-AoE ausweichen',
          fr: 'À l\'extérieur + Esquivez l\'AoE',
          ja: '外 + AoE',
          cn: '远离 + 躲避弹幕',
          ko: '밖으로 + 호밍 AOE 피해요',
        },
      },
    },
    {
      id: 'Copied Engels Reverse-Jointed Goliaths',
      type: 'Ability',
      netRegex: { id: '473F', source: 'Engels', capture: false },
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Adds (Ignore Small)',
          de: 'Adds (kleine ignorieren)',
          fr: 'Adds (ignorez les petits)',
          ja: '雑魚 (小さいのは無視)',
          cn: '小怪（忽略小的）',
          ko: '큰 쫄 잡아요 (작은 쫄 무시)',
        },
      },
    },
    {
      id: 'Copied Engels Incendiary Saturation Bombing',
      type: 'StartsUsing',
      netRegex: { id: '474E', source: 'Engels', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Front and Center',
          de: 'Vorne und Mitte',
          fr: 'Devant et au centre',
          ja: '前方の中へ',
          cn: '前方中间',
          ko: '앞쪽 가운데로',
        },
      },
    },
    {
      id: 'Copied Engels Marx Thrust',
      type: 'StartsUsing',
      netRegex: { id: '48A8', source: 'Engels', capture: false },
      delaySeconds: 9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Look For Wall Saws',
          de: 'Halt nach den kleinen Sägen ausschau',
          fr: 'Repérez les scies murales',
          ja: 'マルクス突撃',
          cn: '观察墙壁',
          ko: '바깥에 마르크스는 어디 있을까요',
        },
      },
    },
    {
      id: 'Copied 9S Neutralization',
      type: 'StartsUsing',
      netRegex: { id: '48F5', source: '9S-Operated Walking Fortress' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Copied 9S Laser Saturation',
      type: 'StartsUsing',
      netRegex: { id: '48F6', source: '9S-Operated Walking Fortress', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Copied 9S Laser Turret',
      type: 'StartsUsing',
      netRegex: { id: '4A74', source: '9S-Operated Walking Fortress', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Copied 9S Ballistic Impact',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread('alert'),
    },
    {
      id: 'Copied 9S Goliath Laser Turret',
      type: 'HeadMarker',
      netRegex: { id: '00A4' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Laser Buster on YOU',
          de: 'Laser Tankbuster auf DIR',
          fr: 'Tank buster laser sur VOUS',
          ja: '自分にレーザー',
          cn: '激光点名',
          ko: '내게 레이저 버스터',
        },
      },
    },
    {
      id: 'Copied 9S Fore-Hind Cannons',
      type: 'StartsUsing',
      netRegex: { id: '48DF', source: '9S-Operated Walking Fortress', capture: false },
      response: Responses.goSides('info'),
    },
    {
      id: 'Copied 9S Dual-Flank Cannons',
      type: 'StartsUsing',
      netRegex: { id: '48DE', source: '9S-Operated Walking Fortress', capture: false },
      response: Responses.goFrontBack('info'),
    },
    {
      id: 'Copied 9S Engage Marx Support',
      type: 'StartsUsing',
      netRegex: { id: '48D3', source: '9S-Operated Walking Fortress', capture: false },
      delaySeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dodge Overhead Saws',
          de: 'Sägen über dem Kopf ausweichen',
          fr: 'Esquivez les scies aériennes',
          ja: 'マルクス支援',
          cn: '躲避头顶锯',
          ko: '마르크스 피해요',
        },
      },
    },
    {
      // Use the ability before the adds show up, as looking for the added combatant
      // also triggers on the first boss.
      id: 'Copied 9S Serial-Jointed Service Models',
      type: 'Ability',
      netRegex: { id: '48EA', source: '9S-Operated Walking Fortress', capture: false },
      response: Responses.killAdds(),
    },
    {
      id: 'Copied 9S Engage Goliath Tank Support',
      type: 'StartsUsing',
      netRegex: { id: '48E5', source: '9S-Operated Walking Fortress', capture: false },
      response: Responses.killAdds(),
    },
    {
      id: 'Copied 9S Hack Goliath Tank',
      type: 'StartsUsing',
      netRegex: { id: '48E7', source: '9S-Operated Walking Fortress', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Behind Untethered Tank',
          de: 'Hinter den nicht verbundenen Panzer gehen',
          fr: 'Allez derrière le tank non-lié',
          ja: '線のない戦車の後ろへ',
          cn: '没连线的坦克后躲避',
          ko: '줄 없는 탱크 뒤에 숨어요',
        },
      },
    },
    {
      id: 'Copied 9S Shrapnel Impact',
      type: 'StartsUsing',
      netRegex: { id: '48F3', source: '9S-Operated Walking Fortress', capture: false },
      suppressSeconds: 2,
      response: Responses.stackMarker('info'),
    },
    {
      id: 'Copied 9S Bubble',
      type: 'StartsUsing',
      netRegex: { id: '48EB', source: '9S-Operated Walking Fortress', capture: false },
      delaySeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get in the bubble',
          de: 'Geh in die Kuppel',
          fr: 'Allez dans la bulle',
          ja: '泡に入る',
          cn: '进入圈圈',
          ko: '버블 안으로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        '9S-Operated Flight Unit': '9S\' Flugeinheit',
        '9S-Operated Walking Fortress': '9S\' mehrbeinig(?:e|er|es|en) Panzer',
        'Engels': 'Engels',
        '(?<! )Flight Unit': 'Flugeinheit',
        'Goliath Tank': 'Goliath-Panzer',
        'Hobbes': 'Hobbes',
        'Marx': 'Marx',
        'Medium Exploder': 'mittelgroß(?:e|er|es|en) Selbstzerstörung',
        'Multi-leg Medium Model': 'mittelgroßes mehrbeiniges Modell',
        'Quality assurance': 'Warenkontrollhalle',
        'Reverse-jointed Goliath': 'Goliath mit Inversgelenk',
        'Serial-jointed Command Model': 'Befehlsmodell mit Omnigelenk',
        'Serial-jointed Service Model': 'Modell mit Omnigelenk',
        'Small Biped': 'kleiner Zweibeiner',
        'Small Flyer': 'kleine Flugeinheit',
        'The forward deck': 'vordere Deck',
        'The rear deck': 'hintere Deck',
        'Warehouse A': 'Warenlager A',
        'Warehouse B': 'Warenlager B',
        'Warehouse C': 'Warenlager C',
      },
      'replaceText': {
        '360-Degree Bombing Maneuver': 'Offensive: Raketenring',
        'Adds': 'Adds',
        'Anti-Personnel Missile': 'Antipersonenrakete',
        'Area Bombardment': 'Blindraketen',
        'Area Bombing Maneuver': 'Offensive: Raketensalve',
        'Arm Laser': 'Armlaser',
        'Cannons': 'Kanonen',
        'Clanging Blow': 'Schwerer Angriff',
        'Convenient Self-Destruction': 'Selbstsprengung',
        'Crusher Adds': 'Zangenrad Adds',
        'Crushing Wheel': 'Zangenradoffensive',
        'Demolish Structure': 'Terraintilgung',
        'Diffuse Laser': 'Diffusionslaser',
        'Energy Assault': 'Energieschauer',
        'Energy Barrage': 'Energetisches Sperrfeuer',
        'Energy Blast': 'Energetische Explosion',
        'Energy Bombardment': 'Energiemörser',
        'Energy Ring': 'Omnidirektionalenergie',
        'Engage Goliath Tank Support': 'Verstärkung: Goliath-Panzer',
        'Engage Marx Support': 'Verstärkung: Marx',
        'Exploding Tethers': 'Explodierende Verbindungen',
        'Floor': 'Boden',
        'Forceful Impact': 'Heftiges Beben',
        'Frontal Somersault': 'Sprungoffensive',
        'Ground-To-Ground Missile': 'Boden-Boden-Rakete',
        '(?<! )Guided Missile': 'Lenkraketen',
        'Hack Goliath Tank': 'Hacken: Goliath-Panzer',
        'High-Caliber Laser': 'Großkaliberlaser',
        'High-Frequency Laser': 'Hochfrequenzlaser',
        'High-Powered Laser': 'Hochleistungslaser',
        'Incendiary Bombing': 'Brandraketen',
        'Incendiary Saturation Bombing': 'Streubrandraketen',
        'Laser Saturation': 'Omnidirektionallaser',
        'Laser Sight': 'Laserbestrahlung',
        'Laser Turret': 'Hauptgeschützlaser',
        'Laser-Resistance Test': 'Laserresistenztest',
        'Lightfast Blade': 'Lichtklingenschnitt',
        'Marx Activation': 'Marx-Aktivierung',
        'Marx Crush': 'Marxsche Offensive',
        'Marx Impact': 'Marxscher Sturz',
        'Marx Smash': 'Marxscher Schlag',
        '(?<= )Back': 'Hinten',
        '(?<= )Front': 'Vorne',
        'Marx Thrust': 'Marxscher Ansturm',
        'Neutralization': 'Unterwerfung',
        'Precision Guided Missile': 'Schwere Lenkrakete',
        'Radiate Heat': 'Thermaloffensive',
        'Ring Laser': 'Ringlaser',
        'Shockwave': 'Schockwelle',
        'Short-Range Missile': 'Kurzstreckenrakete',
        'Shrapnel Impact': 'Wrackteilregen',
        'Spin': 'Rotation',
        'Surface Missile': 'Raketenschlag',
        'Systematic Airstrike': 'Luftformation',
        'Systematic Siege': 'Kesselformation',
        'Systematic Suppression': 'Artillerieformation',
        'Systematic Targeting': 'Jagdformation',
        'Total Annihilation Maneuver': 'Offensive: Totale Vernichtung',
        'Undock': 'Abdocken',
        'Wall Mechanic': 'Wand Mechanik',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '9S-operated Flight Unit': '9S : module de vol équipé',
        '9S-Operated Walking Fortress': '9S : avec multipède esclave',
        'Engels': 'Engels',
        '(?<! )Flight Unit': 'Module de vol',
        'Goliath Tank': 'Char Goliath',
        'Hobbes': 'Hobbes',
        'Marx': 'Marx',
        'Medium Exploder': 'Unité kamikaze moyenne',
        'Multi-leg Medium Model': 'Multipède moyen',
        'Quality assurance': 'la salle de test',
        'Reverse-jointed Goliath': 'Goliath articulations inversées',
        'Serial-jointed Command Model': 'Modèle multiarticulé : commandant',
        'Serial-jointed Service Model': 'Modèle multiarticulé : soldat',
        'Small Biped': 'Petit bipède',
        'Small Flyer': 'Petite unité volante',
        'The forward deck': 'la plate-forme avant',
        'The rear deck': 'la plate-forme arrière',
        'Warehouse A': 'l\'entrepôt A',
        'Warehouse B': 'l\'entrepôt B',
        'Warehouse C': 'l\'entrepôt C',
      },
      'replaceText': {
        '\\?': ' ?',
        '360-Degree Bombing Maneuver': 'Attaque : tir de missiles circulaire',
        'Adds': 'Adds',
        'Anti-Personnel Missile': 'Pluie de missiles antipersonnel',
        'Area Bombardment': 'Déluge de missiles',
        'Area Bombing Maneuver': 'Attaque : salve de missiles',
        'Arm Laser': 'Lasers brachiaux',
        'Cannons': 'Canons',
        'Clanging Blow': 'Attaque puissante',
        'Convenient Self-Destruction': 'Autodestruction',
        'Crusher Adds': 'Broyeurs',
        'Crushing Wheel': 'Scie circulaire',
        'Demolish Structure': 'Démolition de plate-forme',
        '(?<!Wide-Angle )Diffuse Laser': 'Laser diffractif',
        'Energy Assault': 'Tirs en éventail',
        'Energy Barrage': 'Rideau de balles',
        'Energy Blast': 'Fission de balle',
        'Energy Bombardment': 'Tirs courbes',
        'Energy Ring': 'Tirs multidirectionnels',
        'Engage Goliath Tank Support': 'Appel de renfort : char Goliath',
        'Engage Marx Support': 'Appel de renforts : Marx',
        'Exploding Tethers': 'Liens explosifs',
        'Floor': 'Sol',
        'Forceful Impact': 'Forte secousse',
        'Frontal Somersault': 'Attaque sautée',
        'Ground-To-Ground Missile': 'Missile sol-sol',
        '(?<! )Guided Missile': 'Missile à tête chercheuse',
        'Hack Goliath Tank': 'Piratage : char Goliath',
        'High-Caliber Laser': 'Laser à large faisceau',
        'High-Frequency Laser': 'Laser à haute fréquence',
        'High-Powered Laser': 'Laser surpuissant',
        'Incendiary Bombing': 'Missiles incendiaires',
        'Incendiary Saturation Bombing': 'Salve incendiaire',
        'Laser Saturation': 'Laser multidirectionnel',
        'Laser Sight': 'Rayon laser',
        'Laser Turret': 'Canon laser',
        'Laser-Resistance Test': 'Test de résistance au laser',
        'Lightfast Blade': 'Lame éclair',
        'Marx Activation': 'Activation de Marx',
        'Marx Crush': 'Pinçage de Marx',
        'Marx Impact': 'Chute de Marx',
        'Marx Smash(?! )': 'Coup de Marx',
        'Marx Smash Back': 'Coup de Marx Der',
        'Marx Smash Front': 'Coup de Marx Dev',
        'Marx Smash B/F': 'Coup de Marx Der/Dev',
        'Marx Smash F/B': 'Coup de Marx Dev/Der',
        'Marx Smash L/R': 'Coup de Marx G/D',
        'Marx Smash R/L': 'Coup de Marx D/G',
        'Marx Thrust': 'Charge de Marx',
        'Neutralization': 'Tir de suppression',
        'Precision Guided Missile': 'Missile à tête chercheuse ultraprécise',
        'Radiate Heat': 'Relâchement de chaleur',
        'Ring Laser': 'Anneau laser',
        'Shockwave': 'Onde de choc',
        'Short-Range Missile': 'Missiles à courte portée',
        'Shrapnel Impact': 'Chute de débris',
        'Spin': 'Gyrocoup',
        'Surface Missile': 'Missiles sol-sol',
        'Systematic Airstrike': 'Formation de bombardement',
        'Systematic Siege': 'Formation d\'encerclement',
        'Systematic Suppression': 'Formation de balayage',
        'Systematic Targeting': 'Formation de tir',
        'Total Annihilation Maneuver': 'Attaque : bombardement dévastateur',
        'Undock': 'Désamarrage',
        'Wall Mechanic': 'Mécanique du mur',
        'Wide-Angle Diffuse Laser': 'Super laser diffractif',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        '9S-operated Flight Unit': '９Ｓ：飛行ユニット装備',
        '9S-Operated Walking Fortress': '９Ｓ：多脚戦車従属',
        'Engels': 'エンゲルス',
        '(?<! )Flight Unit': '飛行ユニット',
        'Goliath Tank': '大型戦車',
        'Hobbes': 'ホッブス',
        'Marx': 'マルクス',
        'Medium Exploder': '中型自爆',
        'Multi-leg Medium Model': '中型多脚',
        'Quality assurance': '検品場',
        'Reverse-jointed Goliath': '大型逆関節',
        'Serial-jointed Command Model': '多関節型：司令機',
        'Serial-jointed Service Model': '多関節型：兵隊機',
        'Small Biped': '小型二足',
        'Small Flyer': '小型飛行体',
        'The forward deck': '前部甲板',
        'The rear deck': '後部甲板',
        'Warehouse A': '倉庫A',
        'Warehouse B': '倉庫B',
        'Warehouse C': '倉庫C',
      },
      'replaceText': {
        'Front(?!al)': '前',
        'Back': '後',
        '360-Degree Bombing Maneuver': '攻撃：ミサイル円射',
        '(?<! )Adds': '雑魚',
        'Anti-Personnel Missile': '対人ミサイル乱射',
        'Area Bombardment': 'ミサイル乱射',
        'Area Bombing Maneuver': '攻撃：ミサイル斉射',
        'Arm Laser': '腕部レーザー',
        'Cannons': 'カノン',
        'Clanging Blow': '強攻撃',
        'Convenient Self-Destruction': '自爆攻撃',
        'Crusher Adds': 'マルクス挟撃',
        'Crushing Wheel': '挟撃ホイール',
        'Demolish Structure': '地形破壊攻撃',
        '(?<! )Diffuse Laser': '拡散レーザー',
        'Energy Assault': '連続エネルギー弾',
        'Energy Barrage': 'エネルギー弾幕',
        'Energy Blast': 'エネルギー炸裂',
        'Energy Bombardment': '迫撃エネルギー弾',
        'Energy Ring': '全方位エネルギー弾',
        'Engage Goliath Tank Support': '支援要請：大型戦車',
        'Engage Marx Support': '支援要請：マルクス',
        'Exploding Tethers': '爆発',
        'Floor': '床',
        'Forceful Impact': '大震動',
        'Frontal Somersault': 'ジャンプ攻撃',
        'Ground-To-Ground Missile': '地対地ミサイル',
        '(?<! )Guided Missile': '誘導ミサイル',
        'Hack Goliath Tank': 'ハッキング：大型戦車',
        'High-Caliber Laser': '大口径レーザー',
        'High-Frequency Laser': '高周波レーザー',
        'High-Powered Laser': '高出力レーザー',
        'Incendiary Bombing': '焼尽ミサイル',
        'Incendiary Saturation Bombing': '拡散焼尽ミサイル',
        'Laser Saturation': '全方位レーザー',
        'Laser Sight': 'レーザー照射',
        'Laser Turret': '主砲レーザー',
        'Laser-Resistance Test': '耐レーザー検証',
        'Lightfast Blade': '光刃斬機',
        'Marx Activation': 'マルクス起動',
        'Marx Crush': 'マルクス挟撃',
        'Marx Impact': 'マルクス落下',
        'Marx Smash': 'マルクス打撃',
        'Marx Thrust': 'マルクス突撃',
        'Neutralization': '制圧射撃',
        'Precision Guided Missile': '高性能誘導ミサイル',
        'Radiate Heat': '放熱攻撃',
        'Ring Laser': 'リングレーザー',
        'Serial-Jointed Adds': '多関節型雑魚',
        'Shockwave': '衝撃波',
        'Short-Range Missile': '短距離ミサイル',
        'Shrapnel Impact': '残骸落下',
        'Spin': 'ぶん回す',
        'Surface Missile': '対地ミサイル',
        'Systematic Airstrike': '空爆陣形',
        'Systematic Siege': '包囲陣形',
        'Systematic Suppression': '掃射陣形',
        'Systematic Targeting': '照準陣形',
        'Tank Adds': '戦車',
        'Total Annihilation Maneuver': '攻撃：殲滅爆撃',
        'Undock': 'ドッキング解除',
        'Wide-Angle Diffuse Laser': '広拡散レーザー',
        'Wall Mechanic': '壁のギミック',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '9S-operated Flight Unit': '9S：装备飞行装置',
        '9S-Operated Walking Fortress': '9S：接入多脚战车',
        'Engels': '昂格士',
        '(?<! )Flight Unit': '飞行装置',
        'Goliath Tank': '大型战车',
        'Hobbes': '霍布斯',
        'Marx': '麦喀士',
        'Medium Exploder': '中型自爆',
        'Multi-leg Medium Model': '中型多脚',
        'Quality assurance': '质检场',
        'Reverse-jointed Goliath': '大型逆关节',
        'Serial-Jointed Command Model': '多关节型：司令机',
        'Serial-Jointed Service Model': '多关节型：士兵机',
        'Small Biped': '小型二足',
        'Small Flyer': '小型飞行体',
        'The forward deck': '前部甲板',
        'The rear deck': '后部甲板',
        'Warehouse A': '仓库A',
        'Warehouse B': '仓库B',
        'Warehouse C': '仓库C',
      },
      'replaceText': {
        '360-Degree Bombing Maneuver': '攻击：周边导弹轰炸',
        'Anti-Personnel Missile': '对人导弹乱射',
        'Area Bombardment': '导弹乱射',
        'Area Bombing Maneuver': '攻击：追踪导弹轰炸',
        'Arm Laser': '腕部激光',
        'Cannons': '加农',
        'Clanging Blow': '强攻击',
        'Convenient Self-Destruction': '自爆攻击',
        'Crusher Adds': '粉碎机小怪',
        'Tank Adds': '坦克小怪',
        'Serial-Jointed Adds': '多关节型小怪',
        '(?<! )Adds': '小怪',
        'Crushing Wheel': '碾轮夹击',
        'Demolish Structure': '地形破坏攻击',
        'Wide-Angle Diffuse Laser': '广角扩散射线',
        '(?<! )Diffuse Laser': '扩散射线',
        'Energy Assault': '连续能量弹',
        'Energy Barrage': '能量弹幕',
        'Energy Blast': '能量炸裂',
        'Energy Bombardment': '迫击能量弹',
        'Energy Ring': '全方位能量弹',
        'Engage Goliath Tank Support': '请求支援：大型战车',
        'Engage Marx Support': '请求支援：麦喀士',
        'Exploding Tethers': '爆炸连线',
        'Floor': '地板',
        'Forceful Impact': '大震动',
        'Frontal Somersault': '跳跃攻击',
        'Ground-To-Ground Missile': '地对地导弹',
        'Precision Guided Missile': '高性能追踪导弹',
        '(?<! )Guided Missile': '追踪导弹',
        'Hack Goliath Tank': '骇入：大型战车',
        'High-Caliber Laser': '大口径激光',
        'High-Frequency Laser': '高周波激光',
        'High-Powered Laser': '高功率激光',
        'Incendiary Bombing': '燃烧导弹',
        'Incendiary Saturation Bombing': '扩散燃烧导弹',
        'Laser Saturation': '全方位激光',
        'Laser Sight': '激光照射',
        'Laser Turret': '主炮激光',
        'Laser-Resistance Test': '耐激光检测',
        'Lightfast Blade': '光刃斩机',
        'Marx Activation': '麦喀士启动',
        'Marx Crush': '麦喀士夹击',
        'Marx Impact': '麦喀士冲击',
        'Marx Smash L/R': '麦喀士打击左/右',
        'Marx Smash R/L': '麦喀士打击右/左',
        'Marx Smash Back': '麦喀士打击后',
        'Marx Smash Front': '麦喀士打击前',
        'Marx Smash F/B': '麦喀士打击前/后',
        'Marx Smash B/F': '麦喀士打击后/前',
        'Marx Smash(?! )': '麦喀士打击',
        'Marx Thrust': '麦喀士突击',
        'Neutralization': '压制射击',
        'Radiate Heat': '放热攻击',
        'Ring Laser': '环形激光',
        'Shockwave': '冲击波',
        'Short-Range Missile': '短途导弹',
        'Shrapnel Impact': '残骸坠落',
        'Spin': '中央/侧方旋转攻击',
        'Surface Missile': '对地导弹',
        'Systematic Airstrike': '空袭阵型',
        'Systematic Siege': '包围阵型',
        'Systematic Suppression': '扫射阵型',
        'Systematic Targeting': '瞄准阵型',
        'Total Annihilation Maneuver': '攻击：歼灭轰炸',
        'Undock': '对接解除',
        'Wall Mechanic': '墙机制',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '9S-operated Flight Unit': '9S: 비행 유닛 장비',
        '9S-Operated Walking Fortress': '9S: 다각전차 종속',
        'Engels': '엥겔스',
        '(?<! )Flight Unit': '비행 유닛',
        '(?<! )Goliath Tank': '대형 전차',
        'Hobbes': '홉스',
        'Marx': '마르크스',
        'Medium Exploder': '중형 자폭',
        'Multi-leg Medium Model': '중형 다각',
        'Quality assurance': '검품장',
        'Reverse-jointed Goliath': '대형 역관절',
        'Serial-jointed Command Model': '다관절형: 사령기',
        'Serial-jointed Service Model': '다관절형: 병정기',
        'Small Biped': '소형 이족',
        'Small Flyer': '소형 비행체',
        'The forward deck': '전방 갑판',
        'The rear deck': '후방 갑판',
        'Warehouse A': '창고 A',
        'Warehouse B': '창고 B',
        'Warehouse C': '창고 C',
      },
      'replaceText': {
        'Front(?!al)': '앞',
        'Back': '뒤',
        'F/B': '앞/뒤',
        'B/F': '뒤/앞',
        'L/R': '좌/우',
        'R/L': '우/좌',
        '360-Degree Bombing Maneuver': '공격: 미사일 원형 사격',
        'Tank Adds': '대형 전차 쫄',
        'Serial-Jointed Adds': ' 다관절형 쫄',
        '(?<! )Adds': '쫄',
        'Anti-Personnel Missile': '대인 미사일 난사',
        'Area Bombardment': '미사일 난사',
        'Area Bombing Maneuver': '공격: 미사일 일제 사격',
        'Arm Laser': '팔 레이저',
        'Cannons': '일제 사격',
        'Clanging Blow': '강공격',
        'Convenient Self-Destruction': '자폭 공격',
        'Crusher Adds': '분쇄',
        'Crushing Wheel': '협공 차륜',
        'Demolish Structure': '지형 파괴 공격',
        '(?<! )Diffuse Laser': '확산 레이저', // 같은 영어에 다른 번역 - 광확산 레이저, 확산 레이저 번역 두 개
        'Energy Assault': '연속 에너지탄',
        'Energy Barrage': '에너지 탄막',
        'Energy Blast': '에너지 작렬',
        'Energy Bombardment': '박격 에너지탄',
        'Energy Ring': '전방위 에너지탄',
        'Engage Goliath Tank Support': '지원 요청: 대형 전차',
        'Engage Marx Support': '지원 요청: 마르크스',
        'Exploding Tethers': '선: 폭발',
        'Floor': '바닥 장판',
        'Forceful Impact': '대진동',
        'Frontal Somersault': '점프 공격',
        'Ground-To-Ground Missile': '지대지 미사일',
        '(?<! )Guided Missile': '유도 미사일',
        'Hack Goliath Tank': '해킹: 대형 전차',
        'High-Caliber Laser': '대구경 레이저',
        'High-Frequency Laser': '고주파 레이저',
        'High-Powered Laser': '고출력 레이저',
        'Incendiary Bombing': '소진 미사일',
        'Incendiary Saturation Bombing': '확산 소진 미사일',
        'Laser Saturation': '전방위 레이저',
        'Laser Sight': '레이저 광선',
        'Laser Turret': '주포 레이저',
        'Laser-Resistance Test': '레이저 저항 검증',
        'Lightfast Blade': '빛의 칼날 베기',
        'Marx Activation': '마르크스 기동',
        'Marx Crush': '마르크스 협공',
        'Marx Impact': '마르크스 낙하',
        'Marx Smash': '마르크스 타격',
        'Marx Thrust': '마르크스 돌격',
        'Neutralization': '제압 사격',
        'Precision Guided Missile': '고성능 유도 미사일',
        'Radiate Heat': '열 방출 공격',
        'Ring Laser': '고리 레이저',
        'Shockwave': '충격파',
        'Short-Range Missile': '단거리 미사일',
        'Shrapnel Impact': '잔해 낙하',
        'Spin': '회전 공격',
        'Surface Missile': '대지 미사일',
        'Systematic Airstrike': '공폭 진형',
        'Systematic Siege': '포위 진형',
        'Systematic Suppression': '소사 진형',
        'Systematic Targeting': '조준 진형',
        'Total Annihilation Maneuver': '공격: 섬멸 폭격',
        'Undock': '도킹 해제',
        'Wall Mechanic': '벽 기믹',
        'Wide-Angle Diffuse Laser': '광확산 레이저',
      },
    },
  ],
};

export default triggerSet;
