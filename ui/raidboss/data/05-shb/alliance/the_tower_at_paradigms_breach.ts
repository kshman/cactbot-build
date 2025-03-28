import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Object representing a "Deploy Armaments" attack.
interface DeployArmaments {
  sides: boolean;
  vertical: boolean;
  finishedTime: number;
}

export interface Data extends RaidbossData {
  busterTargets?: string[];
  cloneLunge?: boolean;
  seedTargets?: string[];
  seenSphere?: boolean;
  signalCount?: number;
  deployArmaments?: DeployArmaments[];
}

// TODO:
//   Update Knave knockback directions to instead use cardinals
//   Hansel and Gretel Stronger Together Tethered
//   Hansel & Gretel Passing Lance
//   Hansel & Gretel Breakthrough
//   2P-operated Flight Unit adds
//   Red Girl
//   Meng-Zi / Xun-Zi
//   Better Her Inflorescence Recreate Structure
//   Her Inflorescence Distortion
//   Her Inflorescence Pillar Impact

const triggerSet: TriggerSet<Data> = {
  id: 'TheTowerAtParadigmsBreach',
  zoneId: ZoneId.TheTowerAtParadigmsBreach,
  timelineFile: 'the_tower_at_paradigms_breach.txt',
  triggers: [
    {
      id: 'Paradigm Knave Roar',
      type: 'StartsUsing',
      netRegex: { id: '5EB5', source: 'Knave Of Hearts', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Paradigm Knave Colossal Impact Sides',
      type: 'StartsUsing',
      netRegex: { id: '5EA4', source: 'Knave Of Hearts', capture: false },
      durationSeconds: 5,
      response: Responses.goMiddle(),
    },
    {
      id: 'Paradigm Copied Knave Colossal Impact Sides',
      type: 'StartsUsing',
      netRegex: { id: '5EA4', source: 'Copied Knave', capture: false },
      // Cast time of 8 seconds, clones start casting 6 seconds into the cast.
      delaySeconds: 2.1,
      durationSeconds: 5,
      response: Responses.goMiddle(),
    },
    {
      id: 'Paradigm Knave Colossal Impact Middle',
      type: 'StartsUsing',
      netRegex: { id: '5EA7', source: 'Knave Of Hearts', capture: false },
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go E/W Sides',
          de: 'Geh seitlich nach O/W',
          fr: 'Allez côtés E/O',
          ja: '東/西側へ',
          cn: '去东/西侧',
          ko: '안전: 동/서',
        },
      },
    },
    {
      id: 'Paradigm Copied Knave Colossal Impact Middle',
      type: 'StartsUsing',
      netRegex: { id: '5EA7', source: 'Copied Knave', capture: false },
      delaySeconds: 2.1,
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go N/S Sides',
          de: 'Geh seitlich nach N/S',
          fr: 'Allez côtés N/S',
          ja: '北/南側へ',
          cn: '去南/北侧',
          ko: '안전: 남/북',
        },
      },
    },
    {
      // Also applies for Red Girl Manipulate Energy
      id: 'Paradigm Knave Magic Artillery Beta You',
      type: 'HeadMarker',
      netRegex: { id: '00DA' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Paradigm Knave Magic Artillery Beta Collect',
      type: 'HeadMarker',
      netRegex: { id: '00DA' },
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'Paradigm Knave Magic Artillery Beta',
      type: 'HeadMarker',
      netRegex: { id: '00DA', capture: false },
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
          en: 'Avoid tank buster',
          de: 'Tank buster ausweichen',
          fr: 'Évitez le tank buster',
          ja: 'タンクバスターを避ける',
          cn: '远离坦克死刑',
          ko: '탱크버스터 피해요',
        },
      },
    },
    {
      id: 'Paradigm Knave Magic Artillery Alpha Spread',
      type: 'HeadMarker',
      netRegex: { id: '00A9' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Paradigm Knave Lunge',
      type: 'StartsUsing',
      netRegex: { id: '5EB1', source: 'Knave of Hearts' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback (from boss)',
          de: 'Rückstoß (vom Boss)',
          fr: 'Poussée (depuis le boss)',
          ja: 'ノックバック (ボスから)',
          cn: '击退 (来自Boss)',
          ko: '넉백 (보스)',
        },
      },
    },
    {
      id: 'Paradigm Copied Knave Lunge',
      type: 'StartsUsing',
      netRegex: { id: '5EB1', source: 'Copied Knave' },
      condition: (data) => !data.cloneLunge,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.cloneLunge = true,
      outputStrings: {
        text: {
          en: 'Knockback (from clone)',
          de: 'Rückstoß (vom Klon)',
          fr: 'Poussée (depuis le clone)',
          ja: 'ノックバック (複製体から)',
          cn: '击退 (来自复制体)',
          ko: '넉백 (클론)',
        },
      },
    },
    {
      id: 'Paradigm Copied Knave Lunge Get Middle',
      type: 'StartsUsing',
      netRegex: { id: '60C7', source: 'Knave of Hearts' },
      // Half a second longer cast time than the Lunge itself
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6.5,
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback -> Get Middle',
          de: 'Rückstoß -> Geh in die Mitte',
          fr: 'Poussée -> Allez au milieu',
          ja: 'ノックバック -> 中へ',
          cn: '击退 -> 去中间',
          ko: '넉백 -> 한가운데로',
        },
      },
    },
    {
      id: 'Paradigm Copied Knave Lunge Out of Middle',
      type: 'StartsUsing',
      netRegex: { id: '60C8', source: 'Knave of Hearts' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6.5,
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback -> Out of Middle',
          de: 'Rückstoß -> Raus aus der Mitte',
          fr: 'Poussée -> Sortez du milieu',
          ja: 'ノックバック -> 横へ',
          cn: '击退 -> 去外面',
          ko: '넉백 -> 바깥쪽 (한가운데 있다가 죽어요)',
        },
      },
    },
    {
      id: 'Paradigm Gretel Upgraded Shield',
      type: 'StartsUsing',
      netRegex: { id: '5C69', source: 'Gretel', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Attack Hansel',
          de: 'Hänsel angreifen',
          fr: 'Attaquez Hansel',
          ja: 'ヘンゼルに攻撃',
          cn: '攻击韩塞尔',
          ko: '헨젤 쳐욧',
        },
      },
    },
    {
      id: 'Paradigm Hansel Upgraded Shield',
      type: 'StartsUsing',
      netRegex: { id: '5C6B', source: 'Hansel', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Attack Gretel',
          de: 'Gretel angreifen',
          fr: 'Attaquez Gretel',
          ja: 'グレーテルに攻撃',
          cn: '攻击格雷特',
          ko: '그레텔 쳐욧',
        },
      },
    },
    {
      id: 'Paradigm Hansel/Gretel Wail',
      type: 'StartsUsing',
      netRegex: { id: '5C7[67]', source: ['Hansel', 'Gretel'], capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Paradigm Hansel/Gretel Crippling Blow',
      type: 'StartsUsing',
      netRegex: { id: '5C7[89]', source: ['Hansel', 'Gretel'] },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Paradigm Hansel/Gretel Seed Of Magic Alpha',
      type: 'HeadMarker',
      netRegex: { id: '0060' },
      preRun: (data, matches) => {
        data.seedTargets ??= [];
        data.seedTargets.push(matches.target);
      },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text!();
      },
      outputStrings: {
        text: Outputs.spread,
      },
    },
    {
      id: 'Paradigm Hansel/Gretel Riot Of Magic',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      delaySeconds: 0.5,
      infoText: (data, matches, output) => {
        if (!data.seedTargets)
          return;
        if (data.seedTargets.includes(data.me))
          return;

        if (matches.target === data.me)
          return output.stackOnYou!();

        return output.stackOn!({ player: data.party.member(matches.target) });
      },
      run: (data) => delete data.seedTargets,
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOn: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'Paradigm Hansel/Gretel Lamentation',
      type: 'StartsUsing',
      netRegex: { id: '5C7[34]', source: ['Hansel', 'Gretel'], capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Paradigm Hansel/Gretel Bloody Sweep',
      type: 'StartsUsing',
      netRegex: { id: '5C5[4567]', source: ['Hansel', 'Gretel'] },
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (_data, matches, output) => {
        // Hansel and Gretel each have unique abilities which indicate which
        // side of the Bloody Sweep they're starting in. Hanssel is left
        // handed, and Gretel is right handed. 5C54 and 5C55 indicate that
        // Hansel is on the right and Gretel is on the left, relative to the
        // two bosses. Using this, we can identify if the safe area is
        // between the two, or on the opposite side of the arena.
        //
        // A further complication is that the pair might use Transference
        // first, which causes them to swap places. We can detect this based
        // on the cast time of the Bloody Sweep ability, since the cast time
        // will be extended to account for the Transference. If the swap
        // will take place, then the cast time will go from 7.7 seconds up
        // to 12.7 seconds. We use an average of 10 seconds to detect the
        // swap.
        if (matches.id === '5C54' || matches.id === '5C55') {
          // Hansel is on the right and Gretel is on the left.
          if (parseFloat(matches.castTime) > 10) {
            // Hansel and Gretel will switch places
            return output.between!();
          }
          // Hansel and Gretel stay in same position
          return output.opposite!();
        }
        // Gretel is on the right and Hansel is on the left.
        if (parseFloat(matches.castTime) > 10) {
          // Hansel and Gretel will switch places
          return output.opposite!();
        }
        // Hansel and Gretel stay in same position
        return output.between!();
      },
      outputStrings: {
        between: {
          en: 'Move between',
          de: 'Laufe zwischen beide Bosse',
          fr: 'Allez entre les boss',
          cn: '移动到BOSS之间',
          ko: '둘 사이로',
        },
        opposite: {
          en: 'Move opposite',
          de: 'Laufe entgegengesetzt beider Bosse',
          fr: 'Allez à l\'opposé des boss',
          cn: '移动到BOSS对面',
          ko: '반대쪽으로',
        },
      },
    },
    {
      id: 'Paradigm Red Girl Cruelty',
      type: 'StartsUsing',
      netRegex: { id: '601[23]', source: 'Red Girl', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Paradigm Red Sphere Wave: White',
      type: 'StartsUsing',
      netRegex: { id: '618D', source: 'Red Sphere', capture: false },
      infoText: (data, _matches, output) => {
        // Skip the first callout, since you're still zoning in
        if (data.seenSphere)
          return output.text!();
      },
      run: (data) => data.seenSphere = true,
      outputStrings: {
        text: {
          en: 'Switch to white',
          de: 'Auf Weiß wechseln',
          fr: 'Changez en blanc',
          ja: '白に切替',
          cn: '切换白',
          ko: '햐양으로 바꿔요',
        },
      },
    },
    {
      id: 'Paradigm Red Sphere Wave: Black',
      type: 'StartsUsing',
      netRegex: { id: '618E', source: 'Red Sphere', capture: false },
      infoText: (data, _matches, output) => {
        if (data.seenSphere)
          return output.text!();
      },
      run: (data) => data.seenSphere = true,
      outputStrings: {
        text: {
          en: 'Switch to black',
          de: 'Auf Schwarz wechseln',
          fr: 'Changez en noir',
          ja: '黒に切替',
          cn: '切换黑',
          ko: '깜장으로 바꿔요',
        },
      },
    },
    {
      id: 'Paradigm Meng-Zi/Xun-Zi Universal Assault',
      type: 'StartsUsing',
      netRegex: { id: '5C06', source: ['Meng-Zi', 'Xun-Zi'], capture: false },
      suppressSeconds: 5,
      response: Responses.aoe(),
    },
    // Deploy Armaments
    //
    // This attack has two variations and can be cast from two headings. The
    // first variation causes two line AOEs to hit with the center being
    // safe. The second variation causes a single line AOE to be cast in the
    // middle, with the sides safe. It can either be cast horizontally or
    // vertically over the arena.
    //
    // There are several skill IDs involved:
    // 5C00: indicate start of a middle line attack. Always appears with one
    //       5C02 cast
    // 5C03: indicate start of a two side lines attack. Always appears with
    //       2x 5C05 casts
    // 5C01: indicates a single line attack comboing with the other boss.
    //       Always appears simultaneously with the other bosses abilities
    //       and a 6078 cast.
    // 5C04: indicates a two side lines attack comboing with the other boss
    //       Always appears simultaneously with the other bosses abilities
    //       and 2x 6079 casts.
    //
    // Because these attacks overlap, we use one trigger to collect the
    // active attacks, and a second trigger to display an alert on where to
    // go for safety.
    {
      id: 'Paradigm Meng-Zi/Xun-Zi Deploy Armaments Collect',
      type: 'StartsUsing',
      netRegex: { id: ['5C00', '5C01', '5C03', '5C04'] },
      run: (data, matches) => {
        data.deployArmaments ??= [];

        // Convert the heading into 0=N, 1=E, 2=S, 3=W
        const direction = Math.round(2 - 2 * parseFloat(matches.heading) / Math.PI) % 4;

        const obj: DeployArmaments = {
          sides: matches.id === '5C03' || matches.id === '5C04',
          finishedTime: Date.parse(matches.timestamp) + parseFloat(matches.castTime) * 1000,
          vertical: direction === 0 || direction === 2,
        };

        data.deployArmaments.push(obj);
      },
    },
    {
      id: 'Paradigm Meng-Zi/Xun-Zi Deploy Armaments Trigger',
      type: 'StartsUsing',
      netRegex: { id: ['5C00', '5C01', '5C03', '5C04'] },
      delaySeconds: 0.25,
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        if (!data.deployArmaments)
          return;

        // Get time of current cast
        const now = Date.parse(matches.timestamp);

        // filter and remove any active attacks that have finished
        const active = data.deployArmaments.filter((e) => e.finishedTime > now);
        data.deployArmaments = active;

        if (
          active.some((e) => e.vertical && !e.sides) &&
          active.some((e) => !e.vertical && !e.sides)
        ) {
          // Two middle-line AOEs, so go to the corner
          return output.corner!();
        } else if (
          active.some((e) => e.vertical && e.sides) &&
          active.some((e) => !e.vertical && e.sides)
        ) {
          // Two side-line AOEs, so go to the center
          return output.center!();
        } else if (
          active.some((e) => e.vertical && !e.sides) &&
          active.some((e) => !e.vertical && e.sides)
        ) {
          // vertical middle-line and horizontal side-lines
          return output.westBoss!();
        } else if (
          active.some((e) => e.vertical && e.sides) &&
          active.some((e) => !e.vertical && !e.sides)
        ) {
          // vertical side-lines and horizontal middle-line
          return output.northBoss!();
        } else if (active.some((e) => e.vertical && e.sides)) {
          // vertical side-lines
          return output.center!();
        } else if (active.some((e) => e.vertical && !e.sides)) {
          // vertical middle-line
          return output.west!();
        } else if (active.some((e) => !e.vertical && e.sides)) {
          // horizontal side-lines
          return output.center!();
        } else if (active.some((e) => !e.vertical && !e.sides)) {
          // horizontal middle-line
          return output.north!();
        }
        // other combinations are unexpected
        return output.oops!();
      },
      outputStrings: {
        center: {
          en: 'Go to Center',
          de: 'Geh in die Mitte',
          fr: 'Allez au centre',
          cn: '去中间',
          ko: '한가운데로',
        },
        northBoss: {
          en: 'Go to North Boss',
          de: 'Geh zum nördlichen Boss',
          fr: 'Allez au Nord (boss)',
          cn: '去北(上)边BOSS脚下',
          ko: '북쪽 보스로',
        },
        north: {
          en: 'Go North',
          de: 'Geh nach Norden',
          fr: 'Allez au Nord',
          cn: '去北(上)边',
          ko: '북쪽으로',
        },
        westBoss: {
          en: 'Go to West Boss',
          de: 'Geh zum westlichen Boss',
          fr: 'Allez à l\'Ouest (boss)',
          cn: '去西(左)边BOSS脚下',
          ko: '서쪽 보스로',
        },
        west: {
          en: 'Go West',
          de: 'Geh nach Westen',
          fr: 'Allez à l\'Ouest',
          cn: '去西(左)边',
          ko: '서쪽으로',
        },
        corner: {
          en: 'Go to Corner',
          de: 'Geh in eine Ecke',
          fr: 'Allez dans un coin',
          cn: '去角落',
          ko: '구석으로',
        },
        oops: {
          en: 'Avoid line AOEs',
          de: 'Weiche den Linien AoEs aus',
          fr: 'Évitez les AoEs en ligne',
          cn: '躲避直线AOE',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'Paradigm False Idol Screaming Score',
      type: 'StartsUsing',
      netRegex: { id: '5BDD', source: 'False Idol', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Paradigm False Idol Made Magic Left',
      type: 'StartsUsing',
      netRegex: { id: '5BD6', source: 'False Idol', capture: false },
      durationSeconds: 5,
      response: Responses.goRight(),
    },
    {
      id: 'Paradigm False Idol Made Magic Right',
      type: 'StartsUsing',
      netRegex: { id: '5BD7', source: 'False Idol', capture: false },
      durationSeconds: 5,
      response: Responses.goLeft(),
    },
    {
      id: 'Paradigm False Idol Lighter Note',
      type: 'HeadMarker',
      netRegex: { id: '0001' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Lighter Note on YOU',
          de: 'Weißer Choral auf DIR',
          fr: 'Blanc : imprécation sur VOUS',
          ja: '自分に連続AoE',
          cn: '地火点名',
          ko: '내게 라이터 노트 장판 설치',
        },
      },
    },
    {
      id: 'Paradigm False Idol Darker Note You',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Paradigm False Idol Darker Note Collect',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'Paradigm False Idol Darker Note',
      type: 'HeadMarker',
      netRegex: { id: '008B', capture: false },
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
          en: 'Avoid tank buster',
          de: 'Tank buster ausweichen',
          fr: 'Évitez le tank buster',
          ja: 'タンクバスターを避ける',
          cn: '远离坦克死刑',
          ko: '탱크버스터 피해요',
        },
      },
    },
    {
      id: 'Paradigm Her Inflorescence Screaming Score',
      type: 'StartsUsing',
      netRegex: { id: '5BF5', source: 'Her Inflorescence', capture: false },
      response: Responses.aoe(),
    },
    {
      // startsUsing callout is too early, instead callout when the cast has finished
      id: 'Paradigm Her Inflorescence Recreate Structure',
      type: 'Ability',
      netRegex: { id: '5BE1', source: 'Her Inflorescence', capture: false },
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dodge Building Below',
          de: 'Gebäude unter einem ausweichen',
          fr: 'Esquivez le bâtiment arrivant d\'en dessous',
          ja: '下の建物に当たらないように',
          cn: '躲避下方建筑',
          ko: '아래보고 빌딩 피해요',
        },
      },
    },
    {
      id: 'Paradigm Her Inflorescence Recreate Signal',
      type: 'StartsUsing',
      netRegex: { id: '5BE3', source: 'Her Inflorescence', capture: false },
      run: (data) => data.signalCount = 0,
    },
    {
      id: 'Paradigm Her Inflorescence Recreate Signal Collect',
      type: 'Tether',
      netRegex: { id: '0036', target: 'Her Inflorescence', capture: false },
      preRun: (data) => data.signalCount = (data.signalCount ?? 0) + 1,
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        if ((data.signalCount ?? 0) % 5 === 0)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Go To Red Light',
          de: 'Geh zum roten Licht',
          fr: 'Allez au feu rouge',
          ja: '赤信号の線路へ',
          cn: '去红灯',
          ko: '빨강 신호로',
        },
      },
    },
    {
      id: 'Paradigm Her Inflorescence Heavy Arms Middle',
      type: 'StartsUsing',
      netRegex: { id: '5BED', source: 'Her Inflorescence', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Paradigm Her Inflorescence Heavy Arms Sides',
      type: 'StartsUsing',
      netRegex: { id: '5BEF', source: 'Her Inflorescence', capture: false },
      suppressSeconds: 1,
      response: Responses.goFrontBack(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'White Dissonance / Black Dissonance': 'White/Black Dissonance',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        '2P-Operated Flight Unit': '2Ps Flugeinheit',
        'Beyond': 'Zenit',
        'Black Lance': 'schwarz(?:e|er|es|en) Lanze',
        'Black Pylon': 'schwarz(?:e|er|es|en) Turm',
        'Closed Area A': 'Sperrgebiet A',
        'Copied Knave': 'Kopiert(?:e|er|es|en) Herzbube',
        'False Idol': 'Ihre Abgöttlichkeit',
        'Gretel': 'Gretel',
        'Hansel': 'Hänsel',
        'Her Inflorescence': 'Ihre Infloreszenz',
        'Knave Of Hearts': 'Herzbube',
        'Meng-Zi': 'Meng-Zi',
        'Red Girl': 'Rot(?:e|er|es|en) Mädchen',
        'Red Sphere': 'rot(?:e|er|es|en) Sphäre',
        'Serial-Jointed Model': 'Modell mit Omnigelenk',
        'Spheroid': 'Sphäre',
        'Staging Node B': 'Sammelknoten B',
        'Staging Node C': 'Sammelknoten C',
        'Staging Node D': 'Sammelknoten D',
        'The Ascension Platform': 'Aufzug',
        'White Lance': 'weiß(?:e|er|es|en) Lanze',
        'Xun-Zi': 'Xun-Zi',
        'Hansel & Gretel': 'Hänsel & Gretel',
      },
      'replaceText': {
        '--targetable\\?--': '--anvisierbar?--',
        'Black Dissonance': 'Schwarze Korrosion',
        '(?<!Tandem Assault: )Bloody Sweep': 'Zertrümmern',
        '(?<!Tandem Assault: )Breakthrough': 'Tjost',
        'Child\'s Play': 'Puppenspiel',
        'Colossal Impact': 'Schwerer Angriff',
        'Crash': 'Kollision',
        'Crippling Blow': 'Verkrüppelnder Schlag',
        'Cruelty': 'Berstender Boden',
        'Darker Note': 'Schwarzer Choral',
        'Deploy Armaments': 'Aktivierte Armierung',
        'Diffuse Energy': 'Diffusionsenergie',
        'Distortion': 'Kontaminierung',
        'Eminence': 'Hoheit',
        'Explosion': 'Explosion',
        'Generate: Barrier': 'Schöpfung: Barrieren',
        'Heavy Arms': 'Armierung',
        'High-Powered Laser': 'Hochleistungslaser',
        'Hungry Lance': 'Lanzentreffer',
        'Knavish Bullets': 'Störschuss',
        'Lamentation': 'Wehklagen',
        'Light Leap': 'Springen',
        'Lighter Note': 'Weißer Choral',
        'Lightfast Blade': 'Lichtklingenschnitt',
        'Lunge': 'Vliesabreibung',
        'Made Magic': 'Magiefeuer',
        'Magic Artillery Alpha': 'Magieschock α',
        'Magic Artillery Beta': 'Magieschock β',
        'Magic Barrage': 'Gebündelter Magiestoß',
        'Magical Interference': 'Magieinterferenz',
        'Maneuver: Standard Laser': 'Offensive: Laser',
        'Manipulate Energy': 'Energetische Ballung',
        'Mixed Signals': 'Signalschaltung',
        '(?<!Tandem Assault: )Passing Lance': 'Scharfrennen',
        'Pervasion': 'Klarheit',
        'Pillar Impact': 'Säuleneinschlag',
        'Place Of Power': 'Kraftfeld-Generierung',
        'Point: Black': 'Schwarzer Durchstoß',
        'Point: White': 'Weißer Durchstoß',
        'Recreate Meteor': 'Reprise: Meteor',
        'Recreate Signal': 'Reprise: Signal',
        'Recreate Structure': 'Reprise: Gebäude',
        'Replicate': 'Kopieren',
        'Rhythm Rings': 'Staccato',
        'Riot Of Magic': 'Magiewelle',
        'Roar': 'Biestschrei',
        'Scattered Magic': 'Magieschauer',
        'Screaming Score': 'Solmisation',
        'Seed Of Magic(?! )': 'Magiestoß',
        'Seed Of Magic Alpha': 'Magiestoß α',
        'Seed Of Magic Beta': 'Magiestoß β',
        'Shock: Black': 'Schwarzer Impakt',
        'Shock: White': 'Weißer Impakt',
        'Shockwave': 'Schockwelle',
        'Spheroids': 'Sphärisches Feuer',
        'Stacking The Deck': 'Kettenangriff',
        'Sublime Transcendence': 'Transzendenz',
        'Tandem(?! Assault)': 'Verbundenheit',
        'Tandem Assault: Bloody Sweep': 'Kettenangriff: Zertrümmern',
        'Tandem Assault: Breakthrough': 'Kettenangriff: Tjost',
        'Tandem Assault: Passing Lance': 'Kettenangriff: Scharfrennen',
        'The Final Song': 'Das Letzte Lied',
        'Towerfall': 'Turmsturz',
        'Transference': 'Transfer',
        'Uneven Footing': 'Aufschlag',
        'Universal Assault': 'Omnidirektionalangriff',
        'Upgraded Lance': 'Upgrade: Lanze',
        'Upgraded Shield': 'Upgrade: Schild',
        'Vortex': 'Einsaugen',
        'Wail': 'Feldgeschrei',
        'Wandering Trail': 'Ringstechen',
        'Wave: Black': 'Schwarze Partikel',
        'Wave: White': 'Weiße Partikel',
        'White Dissonance': 'Weiße Korrosion',
        'Wipe: Black': 'Schwarze Detonation',
        'Wipe: White': 'Weiße Detonation',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '2P-Operated Flight Unit': '2P : module de vol équipé',
        'Beyond': 'Sommet',
        'Black Lance': 'lance noire',
        'Black Pylon': 'pilier noir',
        'Closed Area A': 'Secteur cloisonné A',
        'Copied Knave': 'réplique de Jack',
        'False Idol': 'déesse factice',
        'Gretel': 'Gretel',
        'Hansel': 'Hansel',
        'Her Inflorescence': 'déesse éclose',
        'Knave Of Hearts': 'Jack',
        'Meng-Zi': 'Meng-Zi',
        'Red Girl': 'fille en rouge',
        'Red Sphere': 'noyau orange',
        'Serial-Jointed Model': 'modèle multiarticulé',
        'Spheroid': 'sphère',
        'Staging Node B': 'Pare-feu B',
        'Staging Node C': 'Pare-feu C',
        'Staging Node D': 'Pare-feu D',
        'The Ascension Platform': 'Plateforme élévatrice',
        'White Lance': 'lance blanche',
        'Xun-Zi': 'Xun-Zi',
        'Hansel & Gretel': 'duo d\'armures',
      },
      'replaceText': {
        '--targetable\\?--': '--ciblable ?--',
        '(?<!Tandem Assault: )Bloody Sweep': 'Balayage tranchant',
        '(?<!Tandem Assault: )Breakthrough': 'Grande ruée',
        'Child\'s Play': 'Marionnettiste',
        'Colossal Impact': 'Attaque puissante',
        'Crash': 'Collision',
        'Crippling Blow': 'Coup handicapant',
        'Cruelty': 'Embûche',
        'Darker Note': 'Noir : imprécation',
        'Deploy Armaments': 'Activation de l\'armement',
        'Diffuse Energy': 'Tirs dispersés',
        'Distortion': 'Corruption',
        'Eminence': 'Autorité',
        'Explosion': 'Explosion',
        'Generate: Barrier': 'Matérialisation : murs',
        'Heavy Arms': 'Bras armé',
        'High-Powered Laser': 'Laser surpuissant',
        'Hungry Lance': 'Lance tranchante',
        'Knavish Bullets': 'Projectile anti-magie',
        'Lamentation': 'Lamentation',
        'Light Leap': 'Bond',
        'Lighter Note': 'Blanc : imprécation',
        'Lightfast Blade(?! 1\\?)': 'Lame éclair',
        'Lightfast Blade 1\\?': 'Lame éclair 1 ?',
        'Lunge': 'Charge',
        'Made Magic': 'Déferlante magique',
        'Magic Artillery Alpha': 'Balles magiques percutantes α',
        'Magic Artillery Beta': 'Balles magiques percutantes β',
        'Magic Barrage': 'Rafale magique',
        'Magical Interference': 'Interférence magique',
        'Maneuver: Standard Laser': 'Attaque : laser',
        'Manipulate Energy': 'Concentration énergétique',
        'Mixed Signals': 'Allumage des feux',
        '(?<!Tandem Assault: )Passing Lance': 'Ruée des lances',
        'Pervasion': 'Perméabilisation',
        'Pillar Impact': 'Éboulis',
        'Place Of Power': 'Déploiement de champ de force',
        'Point: Black': 'Noir : poignardage',
        'Point: White': 'Blanc : poignardage',
        'Recreate Meteor': 'Recréation : météore',
        'Recreate Signal': 'Recréation : feux de circulation',
        'Recreate Structure': 'Recréation : immeuble',
        'Replicate': 'Réplication',
        'Rhythm Rings': 'Anneau d\'incantation',
        'Riot Of Magic': 'Pilonnage magique',
        'Roar': 'Rugissement',
        'Scattered Magic': 'Éclatement magique',
        'Screaming Score': 'Récital',
        'Seed Of Magic(?! )': 'Balles magiques',
        'Seed Of Magic Alpha': 'Balles magiques α',
        'Seed Of Magic Beta': 'Balles magiques β',
        'Shock: Black': 'Noir : impact',
        'Shock: White': 'Blanc : impact',
        'Shockwave': 'Onde de choc',
        'Spheroids': 'Déploiement de sphères',
        'Stacking The Deck': 'Combinaison',
        'Sublime Transcendence': 'Abstraction',
        'Tandem(?! Assault)': 'Combo',
        'Tandem Assault: Bloody Sweep': 'Combinaison : balayage tranchant',
        'Tandem Assault: Breakthrough': 'Combinaison : grande ruée',
        'Tandem Assault: Passing Lance': 'Combinaison : ruée des lances',
        'The Final Song': 'Ultime cantate',
        'Towerfall': 'Écroulement',
        'Transference': 'Transfert',
        'Uneven Footing': 'Impact frontal',
        'Universal Assault': 'Attaque multidirectionnelle',
        'Upgraded Lance': 'Renforcement : lance',
        'Upgraded Shield': 'Renforcement : bouclier',
        'Vortex': 'Aspiration',
        'Wail': 'Cri déchirant',
        'Wandering Trail': 'Disques magiques',
        'Wave: Black': 'Noir : onde',
        'Wave: White': 'Blanc : onde',
        'White Dissonance / Black Dissonance': 'Blanc/Noir : rongement',
        'Wipe: Black': 'Noir : grosse Explosion',
        'Wipe: White': 'Blanc : grosse Explosion',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        '2P-Operated Flight Unit': '２Ｐ：飛行ユニット装備',
        'Beyond': '頂上',
        'Black Lance': '黒槍',
        'Black Pylon': '黒柱',
        'Closed Area A': '封鎖区画A',
        'Copied Knave': '複製サレタジャック',
        'False Idol': '偽造サレタ神',
        '(?<!& )Gretel': 'グレーテル',
        'Hansel(?! &)': 'ヘンゼル',
        'Her Inflorescence': '開花シタ神',
        'Knave Of Hearts': 'ジャック',
        'Meng-Zi': 'モウシ',
        'Red Girl': '赤い少女',
        'Red Sphere': '赤球',
        'Serial-Jointed Model': '多関節型',
        'Spheroid': '球体',
        'Staging Node B': '迎撃区画B',
        'Staging Node C': '迎撃区画C',
        'Staging Node D': '迎撃区画D',
        'The Ascension Platform': '昇降機',
        'White Lance': '白槍',
        'Xun-Zi': 'ジュンシ',
        'Hansel & Gretel': 'ヘンゼル&グレーテル',
      },
      'replaceText': {
        'Black Dissonance': '浸食：黒',
        '(?<!Tandem Assault: )Bloody Sweep': '薙ぎ払い',
        '(?<!Tandem Assault: )Breakthrough': '重突進',
        'Child\'s Play': '人形遣い',
        'Colossal Impact': '強攻撃',
        'Crash': '衝突',
        'Crippling Blow': '痛打',
        'Cruelty': '強襲',
        'Darker Note': '断唱：黒',
        'Deploy Armaments': '武装起動',
        'Diffuse Energy': '拡散エネルギー弾',
        'Distortion': '汚染',
        'Eminence': '威光',
        'Explosion': '爆発',
        'Generate: Barrier': '生成：障壁',
        'Heavy Arms': '武装',
        'High-Powered Laser': '高出力レーザー',
        'Hungry Lance': '槍薙ぎ',
        'Knavish Bullets': '魔障弾',
        'Lamentation': '慟哭',
        'Light Leap': '跳躍',
        'Lighter Note': '断唱：白',
        'Lightfast Blade': '光刃斬機',
        'Lunge': '体当たり',
        'Made Magic': '魔力放出',
        'Magic Artillery Alpha': '魔法衝撃弾α',
        'Magic Artillery Beta': '魔法衝撃弾β',
        'Magic Barrage': '魔法弾連射',
        'Magical Interference': '魔力干渉',
        'Maneuver: Standard Laser': '攻撃：レーザー',
        'Manipulate Energy': 'エネルギー集中',
        'Mixed Signals': '信号切替',
        '(?<!Tandem Assault: )Passing Lance': '槍突進',
        'Pervasion': '透過',
        'Pillar Impact': '崩落',
        'Place Of Power': '力場生成',
        'Point: Black': '刺突：黒',
        'Point: White': '刺突：白',
        'Recreate Meteor': '再現：メテオ',
        'Recreate Signal': '再現：信号',
        'Recreate Structure': '再現：建物',
        'Replicate': '複製',
        'Rhythm Rings': '魔唱輪',
        'Riot Of Magic': '魔法弾放射',
        'Roar': '咆哮',
        'Scattered Magic': '魔力飛散',
        'Screaming Score': '唱譜',
        'Seed Of Magic(?! )': '魔法弾',
        'Seed Of Magic Alpha': '魔法弾α',
        'Seed Of Magic Beta': '魔法弾β',
        'Shock: Black': '衝撃：黒',
        'Shock: White': '衝撃：白',
        'Shockwave': '衝撃波',
        'Spheroids': '球体放出',
        'Stacking The Deck': '連携攻撃',
        'Sublime Transcendence': '超越',
        'Tandem(?! Assault)': '連携',
        'Tandem Assault: Bloody Sweep': '連携攻撃：薙ぎ払い',
        'Tandem Assault: Breakthrough': '連携攻撃：重突進',
        'Tandem Assault: Passing Lance': '連携攻撃：槍突進',
        'The Final Song': '最後の歌',
        'Towerfall': '倒壊',
        'Transference': '転移',
        'Uneven Footing': '激突衝撃',
        'Universal Assault': '全方位攻撃',
        'Upgraded Lance': '強化：槍',
        'Upgraded Shield': '強化：盾',
        'Vortex': '吸引',
        'Wail': '叫び声',
        'Wandering Trail': '魔障輪',
        'Wave: Black': '波動：黒',
        'Wave: White': '波動：白',
        'White Dissonance': '浸食：白',
        'Wipe: Black': '大爆発：黒',
        'Wipe: White': '大爆発：白',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '2P-Operated Flight Unit': '2P：装备飞行装置',
        'Beyond': '塔顶',
        'Black Lance': '黑枪',
        'Black Pylon': '黑柱',
        'Closed Area A': '封锁区域A',
        'Copied Knave': '复制的杰克',
        'False Idol': '伪造的神明',
        '(?<!& )Gretel': '格雷特',
        'Hansel(?! &)': '韩塞尔',
        'Her Inflorescence': '开花的神明',
        'Knave Of Hearts': '杰克',
        'Meng-Zi': '孟子',
        'Red Girl': '红衣少女',
        'Red Sphere': '红球',
        'Serial-Jointed Model': '多关节型',
        'Spheroid': '球体',
        'Staging Node B': '迎击区域B',
        'Staging Node C': '迎击区域C',
        'Staging Node D': '迎击区域D',
        'The Ascension Platform': '升降机',
        'White Lance': '白枪',
        'Xun-Zi': '荀子',
        'Hansel & Gretel': '韩塞尔与格雷特',
      },
      'replaceText': {
        '--targetable\\?--': '--可选中?--',
        'Black Dissonance': '侵蚀：黑',
        '(?<!Tandem Assault: )Bloody Sweep': '横扫',
        '(?<!Tandem Assault: )Breakthrough': '重突进',
        'Child\'s Play': '控制人偶',
        'Colossal Impact': '强攻击',
        'Crash': '冲撞',
        'Crippling Blow': '痛击',
        'Cruelty': '残忍',
        'Darker Note': '断唱：黑',
        'Deploy Armaments': '武装启动',
        'Diffuse Energy': '扩散能量弹',
        'Distortion': '污染',
        'Eminence': '威光',
        'Explosion': '爆炸',
        'Generate: Barrier': '生成：障壁',
        'Heavy Arms': '武装',
        'High-Powered Laser': '高功率激光',
        'Hungry Lance': '枪扫击',
        'Knavish Bullets': '魔障弹',
        'Lamentation': '恸哭',
        'Light Leap': '轻跃',
        'Lighter Note': '断唱：白',
        'Lightfast Blade': '光刃斩机',
        'Lunge': '冲撞',
        'Made Magic': '释放魔力',
        'Magic Artillery Alpha': '魔法冲击弹α',
        'Magic Artillery Beta': '魔法冲击弹β',
        'Magic Barrage': '魔法弹连射',
        'Magical Interference': '魔力干涉',
        'Maneuver: Standard Laser': '攻击：激光',
        'Manipulate Energy': '能量集中',
        'Mixed Signals': '切换信号',
        '(?<!Tandem Assault: )Passing Lance': '枪突进',
        'Pervasion': '穿透',
        'Pillar Impact': '崩落',
        'Place Of Power': '生成力场',
        'Point: Black': '突刺：黑',
        'Point: White': '突刺：白',
        'Recreate Meteor': '再现：陨石',
        'Recreate Signal': '再现：信号灯',
        'Recreate Structure': '再现：建筑物',
        'Replicate': '复制',
        'Rhythm Rings': '魔唱轮',
        'Riot Of Magic': '魔法弹放射',
        'Roar': '咆哮',
        'Scattered Magic': '魔力飞散',
        'Screaming Score': '唱谱',
        'Seed Of Magic(?! )': '魔法弹',
        'Seed Of Magic Alpha': '魔法弹α',
        'Seed Of Magic Beta': '魔法弹β',
        'Shock: Black': '冲击：黑',
        'Shock: White': '冲击：白',
        'Shockwave': '冲击波',
        'Spheroids': '球体放出',
        'Stacking The Deck': '协作攻击',
        'Sublime Transcendence': '超越',
        'Tandem(?! Assault)': '协作',
        'Tandem Assault: Bloody Sweep': '协作攻击：横扫',
        'Tandem Assault: Breakthrough': '协作攻击：重突进',
        'Tandem Assault: Passing Lance': '协作攻击：枪突进',
        'The Final Song': '最后之歌',
        'Towerfall': '崩塌',
        'Transference': '转移',
        'Uneven Footing': '激烈撞击',
        'Universal Assault': '全方位攻击',
        'Upgraded Lance': '强化：枪',
        'Upgraded Shield': '强化：盾',
        'Vortex': '吸引',
        'Wail': '喊叫',
        'Wandering Trail': '魔障轮',
        'Wave: Black': '波动：黑',
        'Wave: White': '波动：白',
        'White Dissonance': '侵蚀：白',
        'Wipe: Black': '大爆炸：黑',
        'Wipe: White': '大爆炸：白',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '2P-Operated Flight Unit': '2P: 비행 유닛 장비',
        'Beyond': '정상',
        'Black Lance': '검은 창',
        'Black Pylon': '검은 기둥',
        'Closed Area A': '봉쇄 구획 A',
        'Copied Knave': '복제된 잭',
        'False Idol': '위조된 신',
        'Her Inflorescence': '꽃피운 신',
        'Knave Of Hearts': '잭',
        'Meng-Zi': '맹자',
        'Red Girl': '붉은 소녀',
        'Red Sphere': '붉은 공',
        'Serial-Jointed Model': '다관절형',
        'Spheroid': '구체',
        'Staging Node B': '요격 구획 B',
        'Staging Node C': '요격 구획 C',
        'Staging Node D': '요격 구획 D',
        'The Ascension Platform': '승강기',
        'White Lance': '하얀 창',
        'Xun-Zi': '순자',
        'Hansel & Gretel': '헨젤과 그레텔',
        '(?<!& )Gretel': '그레텔',
        'Hansel(?! &)': '헨젤',
      },
      'replaceText': {
        '--targetable\\?--': '--타겟 가능?--',
        '\\(G\\)': '(그레텔)',
        '\\(H\\)': '(헨젤)',
        'Black Dissonance': '침식: 흑',
        '(?<!Tandem Assault: )Bloody Sweep': '내리치기',
        '(?<!Tandem Assault: )Breakthrough': '육중한 돌진',
        'Child\'s Play': '인형 놀이',
        'Colossal Impact': '강공격',
        'Crash': '충돌',
        'Crippling Blow': '통타',
        'Cruelty': '강습',
        'Darker Note': '노래 중단: 흑',
        'Deploy Armaments': '무장 기동',
        'Diffuse Energy': '확산 에너지탄',
        'Distortion': '오염',
        'Eminence': '위광',
        'Explosion': '폭발',
        'Generate: Barrier': '생성: 장벽',
        'Heavy Arms': '무장',
        'High-Powered Laser': '고출력 레이저',
        'Hungry Lance': '창 후리기',
        'Knavish Bullets': '마장탄',
        'Lamentation': '통곡',
        'Light Leap': '도약',
        'Lighter Note': '노래 중단: 백',
        'Lightfast Blade': '빛의 칼날 베기',
        'Lunge': '몸통 박치기',
        'Made Magic': '마력 방출',
        'Magic Artillery Alpha': '마법 충격탄 α',
        'Magic Artillery Beta': '마법 충격탄 β',
        'Magic Barrage': '마법탄 연사',
        'Magical Interference': '마력 간섭',
        'Maneuver: Standard Laser': '공격: 레이저',
        'Manipulate Energy': '에너지 집중',
        'Mixed Signals': '신호 변경',
        '(?<!Tandem Assault: )Passing Lance': '창 돌진',
        'Pervasion': '투과',
        'Pillar Impact': '낙하',
        'Place Of Power': '역장 생성',
        'Point: Black': '찌르기: 흑',
        'Point: White': '찌르기: 백',
        'Recreate Meteor': '재현: 메테오',
        'Recreate Signal': '재현: 신호등',
        'Recreate Structure': '재현: 건물',
        'Replicate': '복제',
        'Rhythm Rings': '노래 고리',
        'Riot Of Magic': '마법탄 발사',
        'Roar': '포효',
        'Scattered Magic': '마력 비산',
        'Screaming Score': '노래 악보',
        'Seed Of Magic(?! )': '마법탄',
        'Seed Of Magic Alpha': '마법탄 α',
        'Seed Of Magic Beta': '마법탄 β',
        'Shock: Black': '충격: 흑',
        'Shock: White': '충격: 백',
        'Shockwave': '충격파',
        'Spheroids': '구체 방출',
        'Stacking The Deck': '연계 공격',
        'Sublime Transcendence': '초월',
        'Tandem(?! Assault)': '연계',
        'Tandem Assault: Bloody Sweep': '연계 공격: 내리치기',
        'Tandem Assault: Breakthrough': '연계 공격: 육중한 돌진',
        'Tandem Assault: Passing Lance': '연계 공격: 창 돌진',
        'The Final Song': '마지막 노래',
        'Towerfall': '무너짐',
        'Transference': '전이',
        'Uneven Footing': '격돌 충격',
        'Universal Assault': '전방위 공격',
        'Upgraded Lance': '강화: 창',
        'Upgraded Shield': '강화: 방패',
        'Vortex': '흡인',
        'Wail': '고함',
        'Wandering Trail': '마장륜',
        'Wave: Black': '파동: 흑',
        'Wave: Black(?! )': '파동: 흑',
        'Wave: White': '파동: 백',
        'White Dissonance': '침식: 백',
        'Wipe: Black': '대폭발: 흑',
        'Wipe: White': '대폭발: 백',
      },
    },
  ],
};

export default triggerSet;
