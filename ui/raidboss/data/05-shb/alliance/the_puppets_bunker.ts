import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  phase?: string;
  busterTargets?: string[];
  swipe?: (string | undefined)[];
  heavyPodCount?: number;
}

// TODO: is it worth adding triggers for gaining/losing shield protocol? effect 8F[0-2]
// TODO: Incongruous Spin timeline trigger?

const swipeOutputStrings = {
  right: Outputs.arrowE,
  left: Outputs.arrowW,
};

const triggerSet: TriggerSet<Data> = {
  id: 'ThePuppetsBunker',
  zoneId: ZoneId.ThePuppetsBunker,
  timelineFile: 'the_puppets_bunker.txt',
  triggers: [
    {
      id: 'Puppet Aegis Anti-Personnel Laser You',
      type: 'HeadMarker',
      netRegex: { id: '00C6' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Puppet Aegis Anti-Personnel Laser Collect',
      type: 'HeadMarker',
      netRegex: { id: '00C6' },
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'Puppet Aegis Anti-Personnel Laser Not You',
      type: 'HeadMarker',
      netRegex: { id: '00C6', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (!data.busterTargets)
          return;
        if (data.busterTargets.includes(data.me))
          return;

        if (data.role === 'healer')
          return output.tankBuster!();

        return output.avoidTankBuster!();
      },
      run: (data) => delete data.busterTargets,
      outputStrings: {
        tankBuster: Outputs.tankBuster,
        avoidTankBuster: {
          en: '탱크버스터 피해요',
          de: 'Tank buster ausweichen',
          fr: 'Évitez le tank buster',
          ja: 'タンクバスターを避ける',
          cn: '远离坦克死刑',
          ko: '탱버 피하기',
        },
      },
    },
    {
      id: 'Puppet Aegis Beam Cannons',
      type: 'StartsUsing',
      netRegex: { source: '813P-Operated Aegis Unit', id: '5073', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '좁은 교차점으로 가욧!',
          de: 'Geh zu der nahen Überschneidung',
          fr: 'Allez sur l\'intersection étroite',
          ja: '狭く重なっている範囲へ',
          cn: '去窄交叉口',
          ko: '조금 겹친 곳으로 이동',
        },
      },
    },
    {
      id: 'Puppet Aegis Aerial Support Surface Laser',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: (data, matches) => data.me === matches.target && data.phase !== 'superior',
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '따라오는 레이저: 피해요',
          de: 'Verfolgende Laser: Weg gehen',
          fr: 'Soutien aérien : Éloignez-vous',
          ja: 'レーザー: 外へ',
          cn: '激光点名：快出去',
          ko: '추격 레이저: 이동',
        },
      },
    },
    {
      id: 'Puppet Aegis Refraction Cannons 1',
      type: 'StartsUsing',
      netRegex: { source: '813P-Operated Aegis Unit', id: '5080', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸, 날개 뒤로',
          de: 'Geh links hinter den Flügel',
          fr: 'Allez à gauche, derrière l\'aile',
          ja: '翼の左へ',
          cn: '去左边，翅膀后',
          ko: '왼쪽으로 이동 (날개 뒤)',
        },
      },
    },
    {
      id: 'Puppet Aegis Refraction Cannons 2',
      type: 'StartsUsing',
      netRegex: { source: '813P-Operated Aegis Unit', id: '507F', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽, 날개 뒤로',
          de: 'Geh rechts hinter den Flügel',
          fr: 'Allez à droite, derrière l\'aile',
          ja: '翼の右へ',
          cn: '去右边，翅膀后',
          ko: '오른쪽으로 이동 (날개 뒤)',
        },
      },
    },
    {
      id: 'Puppet Aegis High-Powered Laser',
      type: 'StartsUsing',
      // This is also head marker 003E, but since there's three stacks, just say "stack".
      netRegex: { source: '813P-Operated Aegis Unit', id: '508F', capture: false },
      response: Responses.stackMarker(),
    },
    {
      id: 'Puppet Aegis Life\'s Last Song',
      type: 'StartsUsing',
      netRegex: { source: '813P-Operated Aegis Unit', id: '53B3', capture: false },
      // This is more a "if you haven't done this ever or in a while, here's a reminder."
      // Tell it once, but as this repeats nearly continously forever, only say it once.
      suppressSeconds: 9999,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '고리 잘린 사이로',
          de: 'In die Lücke des Ringes ausweichen',
          fr: 'Esquivez dans les écarts de l\'anneau',
          ja: 'リングの切れ目へ',
          cn: '躲入环形缺口',
          ko: '고리 사이로 이동',
        },
      },
    },
    {
      id: 'Puppet Light Volt Array',
      type: 'StartsUsing',
      netRegex: { source: 'Light Artillery Unit', id: '5211' },
      condition: (data) => data.CanSilence(),
      // Multiple of these cast at the same time.
      suppressSeconds: 5,
      response: Responses.interrupt('alarm'),
    },
    {
      id: 'Puppet Spread Headmarker',
      type: 'HeadMarker',
      // Used for:
      // Homing Missile (Light Artillery)
      // Mechanical Contusion (The Compound)
      // R012: Laser (Compound 2P)
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Puppet Light Maneuver Martial Arm Target',
      type: 'StartsUsing',
      netRegex: { source: 'Light Artillery Unit', id: '5213' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Puppet Light Maneuver Martial Arm Collect',
      type: 'StartsUsing',
      netRegex: { source: 'Light Artillery Unit', id: '5213' },
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'Puppet Light Maneuver Martial Arm Healer',
      type: 'StartsUsing',
      netRegex: { source: 'Light Artillery Unit', id: '5213', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (!data.busterTargets)
          return;
        if (data.busterTargets.includes(data.me))
          return;

        if (data.role === 'healer')
          return output.text!();

        // Note: this doesn't cleave, so don't say anything about avoiding it.
      },
      run: (data) => delete data.busterTargets,
      outputStrings: {
        text: Outputs.tankBuster,
      },
    },
    {
      id: 'Puppet Superior Shield Protocol',
      type: 'StartsUsing',
      netRegex: { id: '4FA[678]', capture: false },
      run: (data) => data.phase = 'superior',
    },
    {
      id: 'Puppet Superior Missile Command',
      type: 'StartsUsing',
      netRegex: { id: '4FBD', capture: false },
      suppressSeconds: 5,
      response: Responses.aoe(),
    },
    {
      // This is for Maneuver: Incendiary Bombing and Maneuver: Area Bombardment.
      id: 'Puppet Superior Incendiary Bombing',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: (data, matches) => data.me === matches.target && data.phase === 'superior',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 불 장판이',
          de: 'Feuer Fläche auf DIR',
          fr: 'Zone au sol de feu sur VOUS',
          ja: '自分にファイヤ',
          cn: '火圈点名',
          ko: '불 장판 대상자',
        },
      },
    },
    {
      id: 'Puppet Superior High-Powered Laser',
      type: 'StartsUsing',
      // Note: no 1B marker for this???
      netRegex: { id: '4FB4', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '한줄 뭉치기 (맵 밖으로 향하게)',
          de: 'Auf einer Linie sammeln (nach außen zeigen)',
          fr: 'Package en ligne (orientez vers l\'extérieur)',
          ja: '直線頭割り (外に向ける)',
          cn: '直线分摊（指向场外）',
          ko: '쉐어 레이저 (밖으로 유도)',
        },
      },
    },
    {
      id: 'Puppet Superior Sharp Turn Inside',
      type: 'StartsUsing',
      netRegex: { id: ['4FA9', '5511', '5513'], capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안쪽으로',
          de: 'Nach Innen bewegen',
          fr: 'Allez à l\'intérieur',
          cn: '去里面',
          ko: '안으로',
        },
      },
    },
    {
      id: 'Puppet Superior Sharp Turn Outside',
      type: 'StartsUsing',
      netRegex: { id: ['4FAA', '5512', '5514'], capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '바깥쪽으로',
          de: 'Nach Außen bewegen',
          fr: 'Allez à l\'extérieur',
          cn: '去外面',
          ko: '밖으로',
        },
      },
    },
    {
      id: 'Puppet Superior Precision Guided Missile You',
      type: 'StartsUsing',
      netRegex: { id: '4FC5' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Puppet Superior Precision Guided Missile Collect',
      type: 'StartsUsing',
      netRegex: { id: '4FC5' },
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'Puppet Superior Precision Guided Missile Not You',
      type: 'StartsUsing',
      netRegex: { id: '4FC5', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (!data.busterTargets)
          return;
        if (data.busterTargets.includes(data.me))
          return;

        if (data.role === 'healer')
          return output.tankBuster!();

        return output.avoidTankBuster!();
      },
      run: (data) => delete data.busterTargets,
      outputStrings: {
        tankBuster: Outputs.tankBuster,
        avoidTankBuster: {
          en: '탱크버스터 피해요',
          de: 'Tank buster ausweichen',
          fr: 'Évitez le tank buster',
          ja: 'タンクバスターを避ける',
          cn: '远离坦克死刑',
          ko: '탱버 피하기',
        },
      },
    },
    {
      id: 'Puppet Superior Sliding Swipe First',
      type: 'StartsUsing',
      netRegex: { id: ['4FA[CD]', '550[DEF]', '5510'] },
      preRun: (data, matches) => {
        data.swipe ??= [];
        const swipeMap: { [id: string]: string } = {
          '4FAC': 'right',
          '4FAD': 'left',
          '550D': 'right',
          '550E': 'left',
          '550F': 'right',
          '5510': 'left',
        };
        data.swipe.push(swipeMap[matches.id]);
      },
      durationSeconds: 6,
      alertText: (data, _matches, output) => {
        data.swipe ??= [];
        if (data.swipe.length !== 1)
          return;

        // Call and clear the first swipe so we can not call it a second time below.
        const swipe = data.swipe[0];
        data.swipe[0] = undefined;
        return output[swipe ?? 'unknown']!();
      },
      outputStrings: swipeOutputStrings,
    },
    {
      id: 'Puppet Superior Sliding Swipe Others',
      type: 'Ability',
      netRegex: { id: ['4FA[CD]', '550[DEF]', '5510'], capture: false },
      alertText: (data, _matches, output) => {
        if (!data.swipe)
          return;

        // The first swipe callout has been cleared to null.
        // Deliberately skip it so that when the first swipe goes off, we call the second.
        let swipe = data.swipe.shift();
        if (!swipe)
          swipe = data.swipe.shift();
        if (!swipe)
          return;
        return output[swipe]!();
      },
      outputStrings: swipeOutputStrings,
    },
    {
      id: 'Puppet Heavy Volt Array',
      type: 'StartsUsing',
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '5006', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Puppet Heavy Active Laser Turret Initial',
      type: 'StartsUsing',
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '4FED', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '위쪽 방향 레이저의 바깥쪽으로 가세요',
          de: 'Raus aus dem oberen Laser',
          fr: 'À l\'extérieur des lasers supérieurs',
          ja: '高いレーザー放射装置の外へ',
          cn: '躲避远程激光',
          ko: '높은 레이저 쪽 밖으로 이동',
        },
      },
    },
    {
      id: 'Puppet Heavy Active Laser Turret Move',
      type: 'StartsUsing',
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '5086', capture: false },
      delaySeconds: 5.3,
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
    {
      id: 'Puppet Heavy Unconventional Voltage',
      type: 'HeadMarker',
      netRegex: { id: '00AC' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 부채꼴 전압 클레브',
          de: 'Spannungs-Cleave auf DIR',
          fr: 'Arcs : Cleave sur VOUS',
          ja: '自分に扇形AoE',
          cn: '扇形AOE点名',
          ko: '전압 장판 대상자',
        },
      },
    },
    {
      id: 'Puppet Heavy Revolving Laser',
      type: 'StartsUsing',
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '5000', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Puppet Heavy High-Powered Laser',
      type: 'StartsUsing',
      // There's only one starts using, but it targets all the tanks sequentially.
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '5001' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankCleaveOnYou: {
            en: '내게 탱크 레이저 클레브가!',
            de: 'Tank Laser cleave auf DIR',
            fr: 'Tank laser cleave sur VOUS',
            ja: '自分にタンクレーザー',
            cn: '坦克直线激光点名',
            ko: '탱커 레이저 대상자',
          },
          avoidTankCleaves: {
            en: '탱크 레이저 클레브 피해요',
            de: 'Tank Laser cleave ausweichen',
            fr: 'Évitez les Tanks laser cleaves',
            ja: 'タンクレーザーを避ける',
            cn: '躲避坦克直线激光',
            ko: '탱커 레이저 피하기',
          },
        };
        if (data.role === 'tank' || matches.target === data.me)
          return { alertText: output.tankCleaveOnYou!() };

        return { infoText: output.avoidTankCleaves!() };
      },
    },
    {
      id: 'Puppet Heavy Support Pod',
      type: 'StartsUsing',
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '4FE9', capture: false },
      // This is approximately when the pods appear.
      delaySeconds: 6,
      alertText: (data, _matches, output) => {
        data.heavyPodCount = (data.heavyPodCount ?? 0) + 1;
        if (data.heavyPodCount <= 2) {
          // The first two are lasers/hammers in either order.
          // The safe spot in both cases is the same direction.
          return output.getOutsideBetweenPods!();
        }
        // There's nothing in the log that indicates what the screens do.
        // TODO: could check logs for tether target/source and say shift left/right?
        return output.getBetweenLasersWatchTethers!();
      },
      outputStrings: {
        getOutsideBetweenPods: {
          en: '포드 사이의 바깥쪽으로 가세요',
          de: 'Zwischen den Pods raus gehen',
          fr: 'À l\'extérieur entre les Pods',
          ja: '外へ、二つのポッドの真ん中に',
          cn: '去场边两个辅助机之间',
          ko: '포드 사이로 이동',
        },
        getBetweenLasersWatchTethers: {
          en: '레이저 사이로 가세요 (모니터 확인!)',
          de: 'Zwischen Laser gehen (auf die Verbindungen achten)',
          fr: 'Allez entre les lasers (regardez les liens)',
          ja: 'レーザーの真ん中に (線を気にして)',
          cn: '去激光之间（观察直线）',
          ko: '레이저 사이로 이동 (연결된 모니터 확인)',
        },
      },
    },
    {
      id: 'Puppet Heavy Synthesize Compound',
      type: 'StartsUsing',
      netRegex: { source: '905P-Operated Heavy Artillery Unit', id: '4FEC', capture: false },
      // TODO: should this say "towers"? or...something else to indicate variable people needed?
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '타워를 파란색이 되도록 들어가세요',
          de: 'Türme zu Blau ändern',
          fr: 'Changez les tours en bleu',
          ja: '塔を青色に',
          cn: '多人踩圈至蓝色',
          ko: '장판이 파랑색이 되도록 들어가기',
        },
      },
    },
    {
      id: 'Puppet Hallway Targeted Laser',
      type: 'HeadMarker',
      netRegex: { id: '00A4' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 레이저가',
          de: 'Laser auf DIR',
          fr: 'Laser sur VOUS',
          ja: '自分にレーザー',
          cn: '激光点名',
          ko: '레이저 대상자',
        },
      },
    },
    {
      id: 'Puppet Compound Mechanical Laceration',
      type: 'StartsUsing',
      netRegex: { source: 'The Compound', id: '51B8', capture: false },
      response: Responses.aoe(),
      run: (data) => data.phase = 'compound',
    },
    {
      id: 'Puppet Compound Mechanical Dissection',
      type: 'StartsUsing',
      netRegex: { source: 'The Compound', id: '51B3', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Puppet Compound Mechanical Decapitation',
      type: 'StartsUsing',
      netRegex: { source: 'The Compound', id: '51B4', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Puppet Compound 2P Centrifugal Slice',
      type: 'StartsUsing',
      netRegex: { source: 'Compound 2P', id: '51B8', capture: false },
      response: Responses.aoe(),
      // Cover this phase for the checkpoint as well.
      run: (data) => data.phase = 'compound',
    },
    {
      id: 'Puppet Compound 2P Prime Blade Out',
      type: 'StartsUsing',
      netRegex: { source: 'Compound 2P', id: ['541F', '5198'], capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Puppet Compound 2P Prime Blade Behind',
      type: 'StartsUsing',
      netRegex: { source: 'Compound 2P', id: ['5420', '5199'], capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Puppet Compound 2P Prime Blade In',
      type: 'StartsUsing',
      netRegex: { source: 'Compound 2P', id: ['5421', '519A'], capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Puppet Compound 2P R012: Laser You',
      type: 'HeadMarker',
      // R012: Laser also puts out 008B headmarkers on non-tanks.
      netRegex: { id: '00DA' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'Puppet Compound 2P R012: Laser Not You',
      type: 'HeadMarker',
      netRegex: { id: '00DA', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (!data.busterTargets)
          return;
        if (data.busterTargets.includes(data.me))
          return;

        if (data.role === 'healer')
          return output.text!();

        // Note: do not call out "avoid tank" here because there's a lot of markers going out.
      },
      run: (data) => delete data.busterTargets,
      outputStrings: {
        text: Outputs.tankBuster,
      },
    },
    {
      id: 'Puppet Compound 2P Three Parts Disdain',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      condition: (data) => data.phase === 'compound',
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Puppet Compound 2P Three Parts Disdain Knockback',
      type: 'HeadMarker',
      netRegex: { id: '003E', capture: false },
      condition: (data) => data.phase === 'compound',
      // Knockback prevention is 6 seconds long, and there's ~9.6s between marker and final hit.
      delaySeconds: 3.6,
      response: Responses.knockback('info'),
    },
    {
      id: 'Puppet Compound 2P Four Parts Resolve',
      type: 'HeadMarker',
      netRegex: { id: ['004F', '0050', '0051', '0052'] },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        const fourPartsMap: { [id: string]: string } = {
          '004F': output.jump!({ num: 1 }),
          '0050': output.cleave!({ num: 1 }),
          '0051': output.jump!({ num: 2 }),
          '0052': output.cleave!({ num: 2 }),
        };
        return fourPartsMap[matches.id] ?? output.unknown!();
      },
      outputStrings: {
        jump: {
          en: '내게 ${num}번째 점프가!',
          de: 'Sprung #${num} auf DIR',
          fr: 'Saut #${num} sur VOUS',
          ja: '自分にジャンプ #${num}',
          cn: '单体跳砍#${num}点名',
          ko: '점프 #${num} 대상자',
        },
        cleave: {
          en: '내게 #${num}번째 클레브가!',
          de: 'Cleave #${num} auf DIR',
          fr: 'Cleave #${num} sur VOUS',
          ja: '自分に直線AoE #${num}',
          cn: '直线劈砍#${num}点名',
          ko: '직선공격 #${num} 대상자',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Puppet Compound 2P Energy Compression',
      type: 'StartsUsing',
      netRegex: { source: 'Compound 2P', id: '51A6', capture: false },
      delaySeconds: 4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '타워 들어가요',
          de: 'Türme nehmen',
          fr: 'Prenez les tours',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '장판 들어가기',
        },
      },
    },
    {
      id: 'Puppet Compound Pod R011: Laser',
      type: 'StartsUsing',
      netRegex: { source: 'Compound Pod', id: '541B', capture: false },
      suppressSeconds: 2,
      // TODO: maybe this could be smarter and we could tell you where to go??
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '레이저 피해요',
          de: 'Laser ausweichen',
          fr: 'Évitez les lasers',
          ja: 'レーザーを避ける',
          cn: '躲避激光',
          ko: '레이저 피하기',
        },
      },
    },
    {
      id: 'Puppet Puppet 2P Prime Blade Puppet Guaranteed In',
      type: 'StartsUsing',
      netRegex: { source: 'Puppet 2P', id: '5421', capture: false },
      suppressSeconds: 2,
      // TODO: have only seen this happen for the guaranteed Puppet In at 6250.7 with 4 clones.
      // TODO: can this happen at other times??
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '모서리에 있는 클론 아래로 가세요',
          de: 'Unter den Klon in einer Ecke gehen',
          fr: 'Allez sous un clone dans un coin ',
          ja: 'コーナーの分裂体の下へ',
          cn: '去分身脚下',
          ko: '구석의 분신 아래로 이동',
        },
      },
    },
    {
      id: 'Puppet Puppet 2P Prime Blade Puppet In',
      type: 'StartsUsing',
      netRegex: { source: 'Puppet 2P', id: '519A', capture: false },
      suppressSeconds: 2,
      // TODO: when I've seen this happen at 6379.4, it's been two clones, that start
      // at corners and then teleport to two cardinals across from each other with fake
      // teleports on the other cardinals.
      // TODO: fix this if these clones can go to corners.
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '십자 방향에 있는 클론 아래로 가세요',
          de: 'Unter den Klon in einer der Himmelsrichtungen gehen',
          fr: 'Allez sous un clone sur un point cardinal',
          ja: '十字にいる分裂体の下へ',
          cn: '去真分身脚下',
          ko: '분신 아래로 이동',
        },
      },
    },
    {
      id: 'Puppet Puppet 2P Prime Blade Puppet Out Corner',
      type: 'StartsUsing',
      netRegex: { source: 'Puppet 2P', id: '5198', capture: false },
      suppressSeconds: 2,
      // Have seen this be either:
      // * 4 clones teleporting around the outside of the arena (corner to corner)
      // * 4 clones teleporting in (to cardinals)
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '클론에게서 멀어져요',
          de: 'Weg von den Klonen',
          fr: 'Éloignez-vous des clones',
          ja: '分裂体から離れる',
          cn: '远离分身',
          ko: '분신에게서 떨어지기',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        '724P-operated superior flight unit \\(A-lpha\\)': '724P: Flugeinheit A-lpha',
        '767P-Operated Superior Flight Unit \\(B-Eta\\)': '767P: Flugeinheit B-eta',
        '772P-Operated Superior Flight Unit \\(C-Hi\\)': '772P: Flugeinheit C-hi',
        '813P-Operated Aegis Unit': '813P: Bollwerk',
        '905P-Operated Heavy Artillery Unit': '905P: Läufer',
        'Compound 2P': '2P: Fusion',
        'Compound Pod': 'Pod: Fusion',
        'Flight Unit': 'Flugeinheit',
        'Light Artillery Unit': 'leicht(?:e|er|es|en) Infanterieeinheit',
        '(?<!Compound )Pod': 'Pod',
        'Puppet 2P': '2P: Spaltung',
        'The Compound': 'Puppenklumpen',
        'The elevated detritus': 'Wrackteil A',
        'The sunken detritus': 'Wrackteil B',
        'The launch deck': 'Abschussdeck',
        'Core Command': 'Kommando-II',
        'The passage': 'Korridor',
      },
      'replaceText': {
        '(?<=\\(|/)Behind(?=\\))': 'Hinter',
        'Aerial Support: Bombardment': 'Luftunterstützung: Bombardement',
        'Aerial Support: Swoop': 'Luftunterstützung: Sturmangriff',
        'Anti-Personnel Missile': 'Abwehrraketen',
        'Apply Shield Protocol': 'Schutzsysteme aktivieren',
        'Authorization: No Restrictions': 'Verstärkung: Entsichern',
        'Centrifugal Slice': 'Spiralklinge',
        'Chemical Burn': 'Chemische Explosion',
        'Chemical Conflagration': 'Chemische Detonation',
        'Compound Pod: R011': 'Pod-Fusion: Programm R011',
        'Compound Pod: R012': 'Pod-Fusion: Programm R012',
        'Energy Bombardment': 'Energiemörser',
        'Energy Compression': 'Energetische Kondensation',
        'Explosion': 'Explosion',
        'Firing Order: Anti-Personnel Laser': 'Feuerbefehl: Antipersonenlaser',
        'Firing Order: High-Powered Laser': 'Feuerbefehl: Hochleistungslaser',
        'Firing Order: Surface Laser': 'Feuerbefehl: Laserschlag',
        'Flight Path': 'Sturmmanöver',
        'Forced Transfer': 'Erzwungener Teleport',
        'Formation: Air Raid': 'Synchronität: Luftschlag',
        'Formation: Sharp Turn': 'Synchronität: Rotationsangriff',
        'Formation: Sliding Swipe': 'Synchronität: Sturmangriff',
        'Four Parts Resolve': 'Vierfache Hiebsequenz',
        '(?<! )High-Powered Laser': 'Hochleistungslaser',
        'Homing Missile Impact': 'Suchraketeneinschlag',
        'Incendiary Barrage': 'Schwere Brandraketen',
        'Incongruous Spin': 'Laterale Rotation',
        'Initiate Self-Destruct': 'Selbstsprengungsysteme',
        'Lethal Revolution': 'Aureolenschlag',
        'Life\'s Last Song': 'Finale Kantate',
        'Lower Laser': 'Unterlaser',
        'Maneuver: Area Bombardment': 'Offensive: Blindraketen',
        'Maneuver: Beam Cannons': 'Offensive: Konvergenzgeschütze',
        'Maneuver: Collider Cannons': 'Offensive: Rotationsgeschütze',
        'Maneuver: High-Order Explosive Blast': 'Offensive: Explosivsprengköpfe',
        'Maneuver: High-Powered Laser': 'Offensive: Hochleistungslaser',
        'Maneuver: Impact Crusher': 'Offensive: Bodenlanze',
        'Maneuver: Incendiary Bombing': 'Offensive: Brandraketen',
        'Maneuver: Long-Barreled Laser': 'Offensive: Langlauf-Laser',
        'Maneuver: Martial Arm': 'Offensive: Nahkampf-Arm',
        'Maneuver: Missile Command': 'Offensive: Raketenkommando',
        'Maneuver: Precision Guided Missile': 'Offensive: Schwere Lenkrakete',
        'Maneuver: Refraction Cannons': 'Offensive: Coriolisgeschütze',
        'Maneuver: Revolving Laser': 'Offensive: Rotationslaser',
        'Maneuver: Saturation Bombing': 'Feuerbefehl: Omnidirektionalrakete',
        'Maneuver: Unconventional Voltage': 'Offensive: Konvergenzspannung',
        'Maneuver: Volt Array': 'Offensive: Diffusionsspannung',
        'Mechanical Contusion': 'Suchlaser',
        'Mechanical Decapitation': 'Zirkularlaser',
        'Mechanical Dissection': 'Linearlaser',
        'Mechanical Laceration': 'Omnilaser',
        'Operation: Access Self-Consciousness Data': 'Ausführen: Pseudo-21O',
        'Operation: Activate Laser Turret': 'Ausführen: Lasergeschütz',
        'Operation: Activate Suppressive Unit': 'Ausführen: Ringgeschütz',
        'Operation: Pod Program': 'Ausführen: Pod-Programm',
        'Operation: Synthesize Compound': 'Ausführen: Explosive Verbindung',
        'Prime Blade': 'Klingensequenz',
        'R010: Laser': 'R010: Laser',
        'R011: Laser': 'R011: Laser',
        'R012: Laser': 'R012: Laser',
        'R030: Hammer': 'R030: Hammer',
        'Relentless Spiral': 'Partikelspirale',
        'Reproduce': 'Teilung des Selbsts',
        '(?<!Formation: )Sharp Turn': 'Rotationsangriff',
        '(?<!Formation: )Sliding Swipe': 'Sturmangriff',
        'Support: Pod': 'Unterstützung: Pod-Schuss',
        'Surface Missile Impact': 'Raketeneinschlag',
        'Three Parts Disdain': 'Dreifache Hiebsequenz',
        'Upper Laser': 'Hauptlaser',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '724P-Operated Superior Flight Unit \\(A-Lpha\\)':
          '724P : avec module de vol renforcé [A-lpha]',
        '767P-Operated Superior Flight Unit \\(B-Eta\\)':
          '767P : avec module de vol renforcé [B-êta]',
        '772P-Operated Superior Flight Unit \\(C-Hi\\)':
          '772P : avec module de vol renforcé [C-hi]',
        '813P-Operated Aegis Unit': '813P : avec unité rempart',
        '905P-Operated Heavy Artillery Unit': '905P : avec unité terrestre lourde',
        'Compound 2P': '2P : amalgame',
        'Compound Pod': 'pod : amalgame',
        'Flight Unit': 'module de vol',
        'Light Artillery Unit': 'unité terrestre légère',
        '(?<!Compound )Pod': 'pod',
        'Puppet 2P': 'clone',
        'The Compound': 'agglomérat de pantins',
        'The elevated detritus': 'Plate-forme A',
        'The sunken detritus': 'Plate-forme B',
        'The launch deck': 'Aire de lancement',
        'Core Command': 'Salle de commandement n°2',
        'The passage': 'Couloir',
      },
      'replaceText': {
        '\\?': ' ?',
        '(?<=\\(|/)Behind(?=\\))': 'Derrière',
        'Aerial Support: Bombardment': 'Soutien aérien : pilonnage',
        'Aerial Support: Swoop': 'Soutien aérien : assaut',
        'Anti-Personnel Missile': 'Missile antipersonnel',
        'Apply Shield Protocol': 'Activation du programme défensif',
        'Authorization: No Restrictions': 'Extension : déverrouillage de l\'armement',
        'Centrifugal Slice': 'Brise-machine étendu',
        'Chemical Burn': 'Explosion chimique',
        'Chemical Conflagration': 'Grande explosion chimique',
        'Compound Pod: R011': 'Pods amalgames : R011',
        'Compound Pod: R012': 'Pods amalgames : R012',
        'Energy Bombardment': 'Tirs courbes',
        'Energy Compression': 'Condensation énergétique',
        '(?<!Grande )Explosion': 'Explosion',
        'Firing Order: Anti-Personnel Laser': 'Ordre de tir : lasers antipersonnels',
        'Firing Order: High-Powered Laser': 'Ordre de tir : laser surpuissant',
        'Firing Order: Surface Laser': 'Ordre de tir : lasers terrestres',
        'Flight Path': 'Manœuvre d\'assaut',
        'Forced Transfer': 'Téléportation forcée',
        'Formation: Air Raid': 'Combo : ruée explosive féroce',
        'Formation: Sharp Turn': 'Combo : taillade en triangle',
        'Formation: Sliding Swipe': 'Combo : taillade propulsée',
        'Four Parts Resolve': 'Grand impact tailladant',
        '(?<! )High-Powered Laser': 'Laser surpuissant',
        'Homing Missile Impact': 'Impact de missile à tête chercheuse',
        'Incendiary Barrage': 'Gros missiles incendiaires',
        'Incongruous Spin': 'Rotation calcinante',
        'Initiate Self-Destruct': 'Autodestruction',
        'Lethal Revolution': 'Taillade circulaire',
        'Life\'s Last Song': 'Ultime Cantate',
        'Lower Laser': 'Laser inférieur',
        'Maneuver: Area Bombardment': 'Attaque : déluge de missiles',
        'Maneuver: Beam Cannons': 'Attaque : canons à particules chargés',
        'Maneuver: Collider Cannons': 'Attaque : canons à particules rotatifs',
        'Maneuver: High-Order Explosive Blast': 'Attaque : ogive déflagrante',
        'Maneuver: High-Powered Laser': 'Attaque : laser surpuissant',
        'Maneuver: Impact Crusher': 'Attaque : marteau-piqueur',
        'Maneuver: Incendiary Bombing': 'Attaque : missiles incendiaires',
        'Maneuver: Long-Barreled Laser': 'Attaque : canon laser long',
        'Maneuver: Martial Arm': 'Attaque : bras de combat',
        'Maneuver: Missile Command': 'Attaque : tirs de missiles en chaîne',
        'Maneuver: Precision Guided Missile': 'Attaque : missiles à tête chercheuse ultraprécise',
        'Maneuver: Refraction Cannons': 'Attaque : canons à particules défléchissants',
        'Maneuver: Revolving Laser': 'Attaque : laser rotatif',
        'Maneuver: Saturation Bombing': 'Attaque : tir de missiles multidirectionnel',
        'Maneuver: Unconventional Voltage': 'Attaque : arcs convergents',
        'Maneuver: Volt Array': 'Attaque : arcs divergents',
        'Mechanical Contusion': 'Rayons fracassants',
        'Mechanical Decapitation': 'Rayons tailladants',
        'Mechanical Dissection': 'Rayons découpants',
        'Mechanical Laceration': 'Rayons multidirectionnels',
        'Operation: Access Self-Consciousness Data': 'Déploiement : données de conscience de 21O',
        'Operation: Activate Laser Turret': 'Déploiement : tourelle laser',
        'Operation: Activate Suppressive Unit': 'Déploiement : unité de tir annulaire',
        'Operation: Pod Program': 'Déploiement : programme de pod',
        'Operation: Synthesize Compound': 'Déploiement : composés explosifs',
        'Prime Blade': 'Brise-machine : coup chargé',
        'R010: Laser': 'R010 : Laser',
        'R011: Laser': 'R011 : Laser',
        'R012: Laser': 'R012 : Laser',
        'R030: Hammer': 'R030 : Marteau',
        'Relentless Spiral': 'Spirale rémanente',
        'Reproduce': 'Clonage',
        '(?<!Formation: )Sharp Turn': 'Taillade en triangle',
        '(?<!Formation: )Sliding Swipe': 'Taillade propulsée',
        'Support: Pod': 'Déploiement : pods',
        'Surface Missile Impact': 'Impact de missile terrestre',
        'Three Parts Disdain': 'Triple impact tailladant',
        'Upper Laser': 'Laser supérieur',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        '724P-Operated Superior Flight Unit \\\\\\(A-Lpha\\\\\\)': '７２４Ｐ：強化型飛行ユニット［A-lpha］',
        '767P-Operated Superior Flight Unit \\\\\\(B-Eta\\\\\\)': '７６７Ｐ：強化型飛行ユニット［B-eta］',
        '772P-Operated Superior Flight Unit \\\\\\(C-Hi\\\\\\)': '７７２Ｐ：強化型飛行ユニット［C-hi］',
        '813P-Operated Aegis Unit': '８１３Ｐ：拠点防衛ユニット装備',
        '905P-Operated Heavy Artillery Unit': '９０５Ｐ：重陸戦ユニット装備',
        'Compound 2P': '２Ｐ：融合体',
        'Compound Pod': 'ポッド：融合体',
        '(?<!Superior )Flight Unit': '飛行ユニット',
        'Light Artillery Unit': '軽陸戦ユニット',
        '(?<!Compound )Pod': 'ポッド',
        'Puppet 2P': '２Ｐ：分裂体',
        'The Compound': '融合シタ人形タチ',
        'The elevated detritus': '残骸A',
        'The sunken detritus': '残骸B',
        'The launch deck': '射出デッキ',
        'Core Command': '第二司令室',
        'The passage': '通路',
      },
      'replaceText': {
        '(?<=\\(|/)Behind(?=\\))': '後ろに',
        'Aerial Support: Bombardment': '航空支援：爆撃',
        'Aerial Support: Swoop': '航空支援：突撃',
        'Anti-Personnel Missile': '対人ミサイル',
        'Apply Shield Protocol': '防御プログラム適用',
        'Authorization: No Restrictions': '拡張：武装ロック解除',
        'Centrifugal Slice': '全面斬機',
        'Chemical Burn': '化合物爆発',
        'Chemical Conflagration': '化合物大爆発',
        'Compound Pod: R011': 'ポッド融合体：R011',
        'Compound Pod: R012': 'ポッド融合体：R012',
        'Energy Bombardment': '迫撃エネルギー弾',
        'Energy Compression': 'エネルギー凝縮',
        'Explosion': '爆発',
        'Firing Order: Anti-Personnel Laser': '砲撃命令：対人レーザー',
        'Firing Order: High-Powered Laser': '砲撃命令：高出力レーザー',
        'Firing Order: Surface Laser': '砲撃命令：対地レーザー',
        'Flight Path': '突撃機動',
        'Forced Transfer': '強制転送',
        'Formation: Air Raid': '連携：急襲爆撃',
        'Formation: Sharp Turn': '連携：転回斬撃',
        'Formation: Sliding Swipe': '連携：突進斬撃',
        'Four Parts Resolve': '四連断重撃',
        '(?<!: )High-Powered Laser': '高出力レーザー',
        'Homing Missile Impact': '追尾ミサイル着弾',
        'Incendiary Barrage': '大型焼尽ミサイル',
        'Incongruous Spin': '逆断震回転',
        'Initiate Self-Destruct': '自爆システム起動',
        'Lethal Revolution': '旋回斬撃',
        'Life\'s Last Song': '終焉ノ歌',
        'Lower Laser': '下部レーザー',
        'Maneuver: Area Bombardment': '攻撃：ミサイル乱射',
        'Maneuver: Beam Cannons': '攻撃：収束粒子砲',
        'Maneuver: Collider Cannons': '攻撃：旋回粒子砲',
        'Maneuver: High-Order Explosive Blast': '攻撃：爆風効果弾頭',
        'Maneuver: High-Powered Laser': '攻撃：高出力レーザー',
        'Maneuver: Impact Crusher': '攻撃：地穿潰砕',
        'Maneuver: Incendiary Bombing': '攻撃：焼尽ミサイル',
        'Maneuver: Long-Barreled Laser': '攻撃：長砲身レーザー',
        'Maneuver: Martial Arm': '攻撃：格闘アーム',
        'Maneuver: Missile Command': '攻撃：ミサイル全弾発射',
        'Maneuver: Precision Guided Missile': '攻撃：高性能誘導ミサイル',
        'Maneuver: Refraction Cannons': '攻撃：偏向粒子砲',
        'Maneuver: Revolving Laser': '攻撃：回転レーザー',
        'Maneuver: Saturation Bombing': '攻撃：全方位ミサイル',
        'Maneuver: Unconventional Voltage': '攻撃：収束ヴォルト',
        'Maneuver: Volt Array': '攻撃：拡散ヴォルト',
        'Mechanical Contusion': '砕機光撃',
        'Mechanical Decapitation(?!/)': '斬機光撃',
        'Mechanical Decapitation/Dissection': '斬機光撃/断機光撃',
        'Mechanical Dissection(?!/)': '断機光撃',
        'Mechanical Dissection/Decapitation': '断機光撃/斬機光撃',
        'Mechanical Laceration': '制圧光撃',
        'Operation: Access Self-Consciousness Data': 'オペレート：２１Ｏ自我データ',
        'Operation: Activate Laser Turret': 'オペレート：レーザータレット',
        'Operation: Activate Suppressive Unit': 'オペレート：環状銃撃ユニット',
        'Operation: Pod Program': 'オペレート：ポッドプログラム',
        'Operation: Synthesize Compound': 'オペレート：爆発性化合物',
        'Prime Blade': '斬機撃：充填',
        'R010: Laser': 'R010：レーザー',
        'R011: Laser': 'R011：レーザー',
        'R012: Laser': 'R012：レーザー',
        'R030: Hammer': 'R030：ハンマー',
        'Relentless Spiral': '渦状光維奔突',
        'Reproduce': '分体生成',
        '(?<!Formation: )Sharp Turn': '転回斬撃',
        '(?<!Formation: )Sliding Swipe': '突進斬撃',
        'Support: Pod': '支援：ポッド射出',
        'Surface Missile Impact': '対地ミサイル着弾',
        'Three Parts Disdain': '三連衝撃斬',
        'Upper Laser': '上部レーザー',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '724P-Operated Superior Flight Unit \\\\\\(A-Lpha\\\\\\)': '724P：强化型飞行装置[A-lpha]',
        '767P-Operated Superior Flight Unit \\\\\\(B-Eta\\\\\\)': '767P：强化型飞行装置[B-eta]',
        '772P-Operated Superior Flight Unit \\\\\\(C-Hi\\\\\\)': '772P：强化型飞行装置[C-hi]',
        '813P-Operated Aegis Unit': '813P：装备据点防卫装置',
        '905P-Operated Heavy Artillery Unit': '905P：装备重型陆战装置',
        'Compound 2P': '2P：融合体',
        'Compound Pod': '辅助机：融合体',
        '(?<!Superior )Flight Unit': '飞行装置',
        'Light Artillery Unit': '轻型陆战装置',
        '(?<!Compound )Pod': '辅助机',
        'Puppet 2P': '2P：分裂体',
        'The Compound': '融合的人偶群',
        'The elevated detritus': '残骸A',
        'The sunken detritus': '残骸B',
        'The launch deck': '发射甲板',
        'Core Command': '第二司令室',
        'The passage': '通道',
      },
      'replaceText': {
        '(?<=\\(|/)Behind(?=\\))': '后',
        'Aerial Support: Bombardment': '航空支援：轰炸',
        'Aerial Support: Swoop': '航空支援：突击',
        'Anti-Personnel Missile': '对人导弹乱射',
        'Apply Shield Protocol': '启用防御程序',
        'Authorization: No Restrictions': '扩展：解除武装锁定',
        'Centrifugal Slice': '全方位斩机',
        'Chemical Burn': '化合物爆炸',
        'Chemical Conflagration': '化合物大爆炸',
        'Compound Pod: R011': '辅助机融合体：R011',
        'Compound Pod: R012': '辅助机融合体：R012',
        'Energy Bombardment': '迫击能量弹',
        'Energy Compression': '能量凝缩',
        'Explosion': '爆炸',
        'Firing Order: Anti-Personnel Laser': '炮击命令：对人激光',
        'Firing Order: High-Powered Laser': '炮击命令：高功率激光',
        'Firing Order: Surface Laser': '炮击命令：对地激光',
        'Flight Path': '突击机动',
        'Forced Transfer': '强制传送',
        'Formation: Air Raid': '协作：突袭轰炸',
        'Formation: Sharp Turn': '协作：回转斩击',
        'Formation: Sliding Swipe': '协作：冲锋斩击',
        'Four Parts Resolve': '四连断重击',
        '(?<! )High-Powered Laser': '高功率激光',
        'Homing Missile Impact': '追尾导弹命中',
        'Incendiary Barrage': '大型燃烬导弹',
        'Incongruous Spin': '逆断震回旋',
        'Initiate Self-Destruct': '自爆系统启动',
        'Lethal Revolution': '旋回斩击',
        'Life\'s Last Song': '终焉之歌',
        'Lower Laser': '下方激光',
        'Maneuver: Area Bombardment': '攻击：导弹乱射',
        'Maneuver: Beam Cannons': '攻击：收束粒子炮',
        'Maneuver: Collider Cannons': '攻击：旋回粒子炮',
        'Maneuver: High-Order Explosive Blast': '攻击：气浪效果弹头',
        'Maneuver: High-Powered Laser': '攻击：高功率激光',
        'Maneuver: Impact Crusher': '攻击：穿地溃碎',
        'Maneuver: Incendiary Bombing': '攻击：燃烬导弹',
        'Maneuver: Long-Barreled Laser': '攻击：长炮激光',
        'Maneuver: Martial Arm': '攻击：格斗机械臂',
        'Maneuver: Missile Command': '攻击：导弹全弹发射',
        'Maneuver: Precision Guided Missile': '攻击：高性能诱导导弹',
        'Maneuver: Refraction Cannons': '攻击：偏向粒子炮',
        'Maneuver: Revolving Laser': '攻击：回旋激光',
        'Maneuver: Saturation Bombing': '攻击：全方位导弹轰炸',
        'Maneuver: Unconventional Voltage': '攻击：集束电压',
        'Maneuver: Volt Array': '攻击：扩散电压',
        'Mechanical Contusion': '碎机光击',
        'Mechanical Decapitation(?!/)': '斩机光击',
        'Mechanical Decapitation/Dissection': '斩机光击/断机光击',
        'Mechanical Dissection(?!/)': '断机光击',
        'Mechanical Dissection/Decapitation': '断机光击/斩机光击',
        'Mechanical Laceration': '压制光击',
        'Operation: Access Self-Consciousness Data': '通信：21O自我数据',
        'Operation: Activate Laser Turret': '通信：激光炮塔',
        'Operation: Activate Suppressive Unit': '通信：环状枪击装置',
        'Operation: Pod Program': '通信：辅助机程序',
        'Operation: Synthesize Compound': '通信：爆炸性化合物',
        'Prime Blade': '斩机击：填充',
        'R010: Laser': 'R010:激光',
        'R011: Laser': 'R011：激光',
        'R012: Laser': 'R012：激光',
        'R030: Hammer': 'R030:重锤',
        'Relentless Spiral': '涡状光线奔涌',
        'Reproduce': '分裂体生成',
        '(?<!Formation: )Sharp Turn': '回转斩击',
        '(?<!Formation: )Sliding Swipe': '冲锋斩击',
        'Support: Pod': '支援：辅助机射出',
        'Surface Missile Impact': '对地导弹命中',
        'Three Parts Disdain': '三连冲击斩',
        'Upper Laser': '上方激光',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '724P-Operated Superior Flight Unit \\\\\\(A-Lpha\\\\\\)': '강화형 비행 유닛 [A-lpha]',
        '767P-Operated Superior Flight Unit \\\\\\(B-Eta\\\\\\)': '767P: 강화형 비행 유닛 [B-eta]',
        '772P-Operated Superior Flight Unit \\\\\\(C-Hi\\\\\\)': '강화형 비행 유닛 [C-hi]',
        '813P-Operated Aegis Unit': '813P: 거점 방위 유닛 장비',
        '905P-Operated Heavy Artillery Unit': '905P: 중장 육지전 유닛 장비',
        'Compound 2P': '2P: 융합체',
        'Compound Pod': '포드: 융합체',
        '(?<!Superior )Flight Unit': '비행 유닛',
        'Light Artillery Unit': '경장 육지전 유닛',
        'Puppet 2P': '2P: 분열체',
        'The Compound': '융합한 인형들',
        '(?<!Compound )Pod': '포드',
        'The elevated detritus': '잔해 A',
        'The sunken detritus': '잔해 B',
        'The launch deck': '사출 갑판',
        'Core Command': '제2사령실',
        'The passage': '통로',
      },
      'replaceText': {
        '\\(Behind\\)': '(뒤)',
        '\\(Out/Behind\\)': '(밖/뒤)',
        '\\(In/Out\\)': '(안/밖)',
        'Aerial Support: Bombardment': '항공 지원: 폭격',
        'Aerial Support: Swoop': '항공 지원: 돌격',
        'Anti-Personnel Missile': '대인 미사일 난사',
        'Apply Shield Protocol': '방어 프로그램 적용',
        'Authorization: No Restrictions': '확장: 무장 잠금 해제',
        'Centrifugal Slice': '전체 베기',
        'Chemical Burn': '화합물 폭발',
        'Chemical Conflagration': '화합물 대폭발',
        'Compound Pod: R011': '포드 융합체: R011',
        'Compound Pod: R012': '포드 융합체: R012',
        'Energy Bombardment': '박격 에너지탄',
        'Energy Compression': '에너지 응축',
        'Explosion': '폭발',
        'Firing Order: Anti-Personnel Laser': '포격 명령: 대인 레이저',
        'Firing Order: High-Powered Laser': '포격 명령: 고출력 레이저',
        'Firing Order: Surface Laser': '포격 명령: 대지 레이저',
        'Flight Path': '돌격기동',
        'Forced Transfer': '강제 전송',
        'Formation: Air Raid': '연계: 급습폭격',
        'Formation: Sharp Turn': '연계: 회전참격',
        'Formation: Sliding Swipe': '연계: 돌진참격',
        'Four Parts Resolve': '사연속 단중격',
        'Homing Missile Impact': '추적 미사일 착탄',
        'Incendiary Barrage': '대형 소진 미사일',
        'Incongruous Spin': '역차진 회전',
        'Initiate Self-Destruct': '자폭 시스템 기동',
        'Lethal Revolution': '선회참격',
        'Life\'s Last Song': '종언의 노래',
        'Lower Laser': '하부 레이저',
        'Maneuver: Area Bombardment': '공격: 미사일 난사',
        'Maneuver: Beam Cannons': '공격: 집속입자포',
        'Maneuver: Collider Cannons': '공격: 선회입자포',
        'Maneuver: High-Order Explosive Blast': '공격: 폭파 탄두',
        'Maneuver: High-Powered Laser': '공격: 고출력 레이저',
        'Maneuver: Impact Crusher': '공격: 지면 타공',
        'Maneuver: Incendiary Bombing': '공격: 소진 미사일',
        'Maneuver: Long-Barreled Laser': '공격: 장포신 레이저',
        'Maneuver: Martial Arm': '공격: 격투 무기',
        'Maneuver: Missile Command': '공격: 미사일 전탄 발사',
        'Maneuver: Precision Guided Missile': '공격: 고성능 유도 미사일',
        'Maneuver: Refraction Cannons': '공격: 편향입자포',
        'Maneuver: Revolving Laser': '공격: 회전 레이저',
        'Maneuver: Saturation Bombing': '공격: 전방위 미사일',
        'Maneuver: Unconventional Voltage': '공격: 집속 볼트',
        'Maneuver: Volt Array': '공격: 확산 볼트',
        'Operation: Access Self-Consciousness Data': '오퍼레이션: 21O 자아 데이터',
        'Operation: Activate Laser Turret': '오퍼레이션: 레이저 포탑',
        'Operation: Activate Suppressive Unit': '오퍼레이션: 순환 총격 유닛',
        'Operation: Pod Program': '오퍼레이션: 포드 프로그램',
        'Operation: Synthesize Compound': '오퍼레이션: 폭발성 화합물',
        'Prime Blade': '검격: 충전',
        'R010: Laser': 'R010: 레이저',
        'R011: Laser': 'R011: 레이저',
        'R012: Laser': 'R012: 레이저',
        'R030: Hammer': 'R030: 해머',
        'Relentless Spiral': '나선광 분출',
        'Reproduce': '분열체 생성',
        'Support: Pod': '지원: 포드 사출',
        'Surface Missile Impact': '대지 미사일 착탄',
        'Three Parts Disdain': '삼연속 충격참',
        'Upper Laser': '상부 레이저',
        '(?<!: )High-Powered Laser': '고출력 레이저',
        'Mechanical Contusion': '분쇄 광격',
        'Mechanical Decapitation(?!/)': '참수 광격',
        'Mechanical Dissection(?!/)': '절단 광격',
        'Mechanical Laceration': '제압 광격',
        'Mechanical Decapitation/Dissection': '참수/절단 광격',
        'Mechanical Dissection/Decapitation': '절단/참수 광격',
        '(?<!Formation: )Sharp Turn': '회전참격',
        '(?<!Formation: )Sliding Swipe': '돌진참격',
        'Three Parts Resolve': '삼연속 단중격',
      },
    },
  ],
};

export default triggerSet;
