import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  phase?: number;
  finalWing?: boolean;
  shakerTargets?: string[];
}

// Shinryu Extreme
const triggerSet: TriggerSet<Data> = {
  id: 'TheMinstrelsBalladShinryusDomain',
  zoneId: ZoneId.TheMinstrelsBalladShinryusDomain,
  timelineFile: 'shinryu-ex.txt',
  triggers: [
    {
      id: 'ShinryuEx Heart Cleanup',
      type: 'RemovedCombatant',
      netRegex: { name: 'Shinryu', capture: false },
      run: (data) => {
        // Explicitly clear so ugly heart message doesn't appear after wipe.
        delete data.phase;
      },
    },
    {
      id: 'ShinryuEx Phase 1',
      type: 'StartsUsing',
      netRegex: { id: '25DE', source: 'Shinryu', capture: false },
      run: (data) => data.phase = 1,
    },
    {
      id: 'ShinryuEx Phase 2',
      type: 'StartsUsing',
      netRegex: { id: '25E7', source: 'Shinryu', capture: false },
      run: (data) => data.phase = 2,
    },
    {
      id: 'ShinryuEx Phase 3',
      type: 'StartsUsing',
      netRegex: { id: '25E4', source: 'Shinryu', capture: false },
      run: (data) => data.phase = 3,
    },
    {
      id: 'ShinryuEx Phase 4',
      type: 'StartsUsing',
      netRegex: { id: '264E', source: 'Shinryu', capture: false },
      run: (data) => data.phase = 4,
    },
    {
      id: 'ShinryuEx Akh Morn',
      type: 'StartsUsing',
      netRegex: { id: '25F3', source: 'Shinryu' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.akhMornOnYou!();
        else if (data.role === 'tank')
          return output.akhMornOn!({ player: data.party.member(matches.target) });
      },
      infoText: (data, matches, output) => {
        if (matches.target === data.me || data.role === 'tank')
          return;

        return output.akhRhaiSpreadAndMove!();
      },
      outputStrings: {
        akhRhaiSpreadAndMove: {
          en: 'Akh Rhai: spread and move',
          ja: 'アク・ラーイ: 散開 動け',
          ko: '아크 라이: 흩어지면서 움직여요',
        },
        akhMornOnYou: {
          en: 'Akh Morn on YOU',
          ja: '自分にアク・モーン',
          ko: '내게 아크몬',
        },
        akhMornOn: {
          en: 'Akh Morn on ${player}',
          ja: '${player}にアク・モーン',
          ko: '아크몬: ${player}',
        },
      },
    },
    {
      id: 'ShinryuEx Diamond Dust',
      type: 'StartsUsing',
      netRegex: { id: '25DD', source: 'Shinryu', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Ice: Stack and Stop',
          ja: '氷: スタック 動かない',
          ko: '얼음: 뭉치고 그대로 스탑',
        },
      },
    },
    {
      id: 'ShinryuEx Dragonfist',
      type: 'StartsUsing',
      netRegex: { id: '2611', source: 'Shinryu', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out of middle',
          ja: '中央から離れ',
          ko: '한가운데 피해요',
        },
      },
    },
    {
      id: 'ShinryuEx Hellfire',
      type: 'StartsUsing',
      netRegex: { id: '25DB', source: 'Shinryu', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get in water',
          ja: '水に入る',
          ko: '물로 들어가요',
        },
      },
    },
    {
      // TODO: the original trigger didn't differentiate the two ability ids.
      // Probably the phase conditional could get removed if it did.
      id: 'ShinryuEx Hypernova',
      type: 'StartsUsing',
      netRegex: { id: ['271F', '25E8'], source: 'Right Wing', capture: false },
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.phase === 3)
          return output.stopToGetFrozen!();

        return output.stackInWater!();
      },
      outputStrings: {
        stopToGetFrozen: {
          en: 'stop to get frozen',
          ja: '止まれ、凍結',
          ko: '멈춰서 그대로 얼어요',
        },
        stackInWater: {
          en: 'Stack in water',
          ja: '水に集合',
          ko: '물에서 뭉쳐요',
        },
      },
    },
    {
      id: 'ShinryuEx Judgement Bolt',
      type: 'StartsUsing',
      netRegex: { id: '25DC', source: 'Shinryu', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'out of water',
          ja: '水から離れ',
          ko: '물 밖으로',
        },
      },
    },
    {
      id: 'ShinryuEx Levinbolt',
      type: 'StartsUsing',
      netRegex: {
        id: ['25EA', '2720', '2725'],
        source: 'Right Wing',
        target: 'Right Wing',
        capture: false,
      },
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.phase === 3)
          return output.baitBoltKeepMoving!();

        return output.spreadOutNoWater!();
      },
      outputStrings: {
        baitBoltKeepMoving: {
          en: 'bait bolt, keep moving',
          ja: '稲妻: 動き続ける',
          ko: '번개! 흩어져요, 그리고 계속 움직여요',
        },
        spreadOutNoWater: {
          en: 'Spread out, no water',
          ja: '散開、水に入らない',
          ko: '흩어져요, 물에는 들어가지 말고',
        },
      },
    },
    {
      id: 'ShinryuEx Levinbolt Phase 3',
      type: 'StartsUsing',
      netRegex: {
        id: ['25EA', '2720', '2725'],
        source: 'Right Wing',
        target: 'Right Wing',
        capture: false,
      },
      condition: (data) => data.phase === 3,
      delaySeconds: 9.5,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'move away',
          ja: '移動',
          ko: '흩어져 도망쳐요',
        },
      },
    },
    {
      id: 'ShinryuEx Icicle Left',
      type: 'Ability',
      netRegex: { id: '25EF', source: 'Icicle' },
      condition: (_data, matches) => {
        return Math.round(parseFloat(matches.x)) === -30 &&
          Math.round(parseFloat(matches.y)) === -15;
      },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'icicle, lean west',
          ja: 'アイシクル: 西へ',
          ko: '아이시클, 서쪽으로',
        },
      },
    },
    {
      id: 'ShinryuEx Icicle Right',
      type: 'Ability',
      netRegex: { id: '25EF', source: 'Icicle' },
      condition: (_data, matches) => {
        return Math.round(parseFloat(matches.x)) === -30 &&
          Math.round(parseFloat(matches.y)) === -25;
      },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'icicle, lean east',
          ja: 'アイシクル: 東へ',
          ko: '아이시클, 동쪽으로',
        },
      },
    },
    {
      id: 'ShinryuEx Tidal Wave',
      type: 'StartsUsing',
      netRegex: { id: '25DA', source: 'Shinryu', capture: false },
      delaySeconds: 3,
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback, look for water',
          ja: 'ノックバック、水を探せ',
          ko: '넉백, 바깥 물 기둥은 어디에!',
        },
      },
    },
    {
      id: 'ShinryuEx Final Tidal Wave',
      type: 'StartsUsing',
      netRegex: { id: '264E', source: 'Shinryu', capture: false },
      condition: (data) => data.role === 'healer',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'no more heals needed',
          ja: 'ヒールはもう要らない',
          ko: '힐 그만 해도 되요',
        },
      },
    },
    {
      id: 'ShinryuEx Tail Slap',
      type: 'StartsUsing',
      netRegex: { id: '25E2', source: 'Tail', capture: false },
      delaySeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tail: Switch targets',
          ja: '尾: タゲチェンジ',
          ko: '꼬리부터 잡아요',
        },
      },
    },
    {
      id: 'ShinryuEx Heart',
      type: 'AddedCombatant',
      netRegex: { name: 'The Worm\'s Heart', capture: false },
      condition: (data) => {
        // Prevent ugly heart message on wipe.
        return data.phase === 1;
      },
      // TODO: If tail is alive, delay this message?
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Heart: Switch targets',
          ja: '心核: タゲチェンジ',
          ko: '심장 나왔네, 잡아요',
        },
      },
    },
    {
      // TODO: can't find the id of this, so using all of them.
      id: 'ShinryuEx Divebomb',
      type: 'StartsUsing',
      netRegex: { id: ['1FA8', '1FF4', '2603'], source: 'Shinryu', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'avoid divebomb',
          ja: 'ダイブボムに避け',
          ko: '다이브밤 피해요',
        },
      },
    },
    {
      id: 'ShinryuEx Death Sentence',
      type: 'StartsUsing',
      netRegex: { id: '260A', source: 'Hakkinryu' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.deathSentenceOnYou!();
        else if (data.role === 'healer')
          return output.deathSentenceOn!({ player: data.party.member(matches.target) });
      },
      infoText: (data, matches, output) => {
        if (matches.target !== data.me && data.role !== 'healer')
          return output.deathSentenceOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        deathSentenceOn: {
          en: 'Death Sentence on ${player}',
          ja: '${player}にデスセンテンス',
          ko: '데스 센텐스: ${player}',
        },
        deathSentenceOnYou: {
          en: 'Death Sentence on YOU',
          ja: '自分にデスセンテンス',
          ko: '내게 데스 센텐스',
        },
      },
    },
    {
      id: 'ShinryuEx Tera Slash',
      type: 'StartsUsing',
      netRegex: { id: '264B', source: 'Shinryu' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'ShinryuEx Wormwail',
      type: 'StartsUsing',
      netRegex: { id: '2648', source: 'Shinryu', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'ShinryuEx Breath',
      type: 'StartsUsing',
      netRegex: { id: '264A', source: 'Shinryu', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'front cleave',
          ja: '正面から離れ',
          ko: '정면 물러서요 (정면 쪼개기)',
        },
      },
    },
    {
      id: 'ShinryuEx Final Left Wing',
      type: 'StartsUsing',
      netRegex: { id: '2718', source: 'Left Wing', capture: false },
      condition: (data) => !data.finalWing,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.finalWing = true,
      outputStrings: {
        text: {
          en: 'kill left first',
          ja: 'レフトウィングに攻撃',
          ko: '왼쪽 날개 먼저 잡아요',
        },
      },
    },
    {
      id: 'ShinryuEx Final Right Wing',
      type: 'StartsUsing',
      netRegex: { id: '2719', source: 'Right Wing', capture: false },
      condition: (data) => !data.finalWing,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.finalWing = true,
      outputStrings: {
        text: {
          en: 'kill right first',
          ja: 'ライトウィングに攻撃',
          ko: '오른쪽 날개 먼저 잡아요',
        },
      },
    },
    {
      id: 'ShinryuEx Tethers',
      type: 'HeadMarker',
      netRegex: { id: '0061' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 3.8,
      infoText: (data, _matches, output) => {
        if (data.phase === 3)
          return output.breakTethersThenStack!();

        return output.breakTethers!();
      },
      outputStrings: {
        breakTethersThenStack: {
          en: 'break tethers then stack',
          ja: '鎖を引き、集合',
          ko: '줄 끊고 뭉쳐요',
        },
        breakTethers: {
          en: 'break tethers',
          ja: '鎖',
          ko: '줄 끊어요',
        },
      },
    },
    {
      id: 'ShinryuEx Tail Marker',
      type: 'HeadMarker',
      netRegex: { id: '007E' },
      condition: Conditions.targetIsYou(),
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'tail marker on you',
          ja: '自分にテイル',
          ko: '내게 꼬리 치기',
        },
      },
    },
    {
      id: 'ShinryuEx Shakers',
      type: 'HeadMarker',
      netRegex: { id: '0028' },
      condition: (data, matches) => {
        data.shakerTargets ??= [];
        data.shakerTargets.push(matches.target);
        return data.shakerTargets.length === 2;
      },
      alarmText: (data, _matches, output) => {
        if (data.shakerTargets?.includes(data.me))
          return output.earthshakerOnYou!();
      },
      alertText: (data, _matches, output) => {
        if (!data.shakerTargets || !data.shakerTargets.includes(data.me))
          return output.avoidEarthshakers!();
      },
      run: (data) => delete data.shakerTargets,
      outputStrings: {
        avoidEarthshakers: {
          en: 'avoid earthshakers',
          ja: 'アースシェーカーに避け',
          ko: '어스세이커 피해요',
        },
        earthshakerOnYou: {
          en: 'earthshaker on you',
          ja: '自分にアースシェーカー',
          ko: '내게 어스세이커',
        },
      },
    },
    {
      id: 'ShinryuEx Cocoon Marker',
      type: 'HeadMarker',
      netRegex: { id: '0039' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Hakkinryu': 'Hakkinryu',
        'Left Wing': 'link(?:e|er|es|en) Schwinge',
        'Right Wing': 'recht(?:e|er|es|en) Schwinge',
        'Shinryu': 'Shinryu',
        'Tail': 'Schwanz',
        'The Worm\'s Heart': 'Shinryus Herz',
        'Icicle': 'Eiszapfen',
        'Cocoon': 'Lichtsphäre',
      },
      'replaceText': {
        '--Reiryu Adds--': '--Reiryu Adds--',
        'Aerial Blast': 'Windschlag',
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Atomic Ray': 'Atomstrahlung',
        'Benighting Breath': 'Dunkelhauch',
        'Cocoon Markers': 'Kokon Marker',
        'Dark Matter': 'Dunkelmaterie',
        'Diamond Dust': 'Diamantenstaub',
        'Dragonfist': 'Drachenfaust',
        'Earth Breath': 'Erdatem',
        'Earthen Fury': 'Gaias Zorn',
        'First Wing': 'Erster Flügel',
        'Gyre Charge': 'Wirbel-Aufladung',
        'Hellfire': 'Höllenfeuer',
        'Hypernova': 'Supernova',
        'Ice Storm': 'Eissturm',
        'Icicle Impact': 'Eiszapfen-Schlag',
        'Judgment Bolt': 'Ionenschlag',
        'Levinbolt': 'Keraunisches Feld',
        'Meteor Impact': 'Meteoreinschlag',
        'Phase': 'Phase',
        'Protostar': 'Protostern',
        'Reiyu Adds': 'Reiyu Adds',
        'Second Wing': 'Zweiter Flügel',
        'Spikesicle': 'Eislanze',
        'Super Cyclone': 'Superzyklon',
        'Shatter': 'Zerfallen',
        'Summon Icicle': 'Flugeis',
        'TAP BUTTON OR ELSE': 'DRÜCKE TASTEN ETC',
        'Tail Marker': 'Schweifmarker',
        'Tail Slap': 'Schweifklapser',
        'Tail Spit': 'Schweifspieß',
        'Tera Slash': 'Tera-Schlag',
        'Tethers': 'Verbindungen',
        'Tidal Wave': 'Flutwelle',
        'Touchdown': 'Himmelssturz',
        'Wormwail': 'Shinryus Ruf',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Hakkinryu': 'Hakkinryu',
        'Icicle': 'stalactite',
        'Left Wing': 'aile gauche',
        'Right Wing': 'aile droite',
        'Shinryu': 'Shinryu',
        'The Worm\'s Heart': 'cœur du dragon',
        'Tail': 'queue',
        'Cocoon': 'cocon de lumière',
      },
      'replaceText': {
        '--Phase': '--Phase',
        '--Reiryu Adds--': '--Adds Reiryu--',
        'Aerial Blast': 'Rafale aérienne',
        'Atomic Ray': 'Rayon atomique',
        'Cocoon Markers': 'Marqueurs Cocon',
        'Dark Matter': 'Matière sombre',
        'Diamond Dust': 'Poussière de diamant',
        'Dragonfist': 'Poing dragon',
        'Earth Breath': 'Souffle de terre',
        'Earthen Fury': 'Fureur tellurique',
        'First Wing': 'Première aile',
        'Gyre Charge': 'Gyrocharge',
        'Hellfire': 'Flammes de l\'enfer',
        'Hypernova': 'Hypernova',
        'Ice Storm': 'Tempête de glace',
        'Judgment Bolt': 'Éclair du jugement',
        'Levinbolt': 'Fulguration',
        'Meteor Impact': 'Impact de météore',
        'Protostar': 'Proto-étoile',
        'Reiyu Adds': 'Adds Ryu',
        'Second Wing': 'Seconde aile',
        'Summon Icicle': 'Appel de stalactite',
        'Tail Marker': 'Marqueur Queue',
        'Tail Slap': 'Gifle caudale',
        'Tail Spit': 'Broche caudale',
        'TAP BUTTON OR ELSE': 'CLIQUEZ SUR LE BOUTON OU AUTRE',
        'Tera Slash': 'TéraTaillade',
        'Tethers': 'Liens',
        'Tidal Wave': 'Raz-de-marée',
        'Touchdown': 'Atterrissage',
        'Akh Morn': 'Akh Morn',
        'Icicle Impact': 'Impact de stalactite',
        'Spikesicle': 'Stalactopointe',
        'Akh Rhai': 'Akh Rhai',
        'Super Cyclone': 'Super cyclone',
        'Shatter': 'Éclatement',
        'Wormwail': 'Gémissement draconique',
        'Benighting Breath': 'Souffle enténébrant',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Left Wing': 'レフトウィング',
        'Right Wing': 'ライトウィング',
        'Shinryu': '神龍',
        'Tail': '神龍の尾',
        'The Worm\'s Heart': '神龍の心核',
        'Icicle': 'アイシクル',
        'Cocoon': '光の繭',
        'Hakkinryu': '白金龍',
      },
      'replaceText': {
        'Aerial Blast': 'エリアルブラスト',
        'Akh Morn': 'アク・モーン',
        'Atomic Ray': 'アトミックレイ',
        'Cocoon Markers': 'マユ マーク',
        'Dark Matter': 'ダークマター',
        'Diamond Dust': 'ダイアモンドダスト',
        'Dragonfist': '龍掌',
        'Earth Breath': 'アースブレス',
        'Earthen Fury': '大地の怒り',
        'First Wing': '翼一つ目',
        'Gyre Charge': 'ジャイヤチャージ',
        'Hellfire': '地獄の火炎',
        'Hypernova': 'スーパーノヴァ',
        'Ice Storm': '吹雪',
        'Judgment Bolt': '裁きの雷',
        'Levinbolt': '稲妻',
        'Meteor Impact': 'メテオインパクト',
        'Phase': 'フェイス',
        'Protostar': 'プロトスター',
        'Reiyu Adds': '雑魚',
        'Second Wing': '翼二つ目',
        'Summon Icicle': 'サモン・アイシクル',
        'TAP BUTTON OR ELSE': 'ボタンを押せ！',
        'Tail Marker': 'テイル マーク',
        'Tail Slap': 'テールスラップ',
        'Tail Spit': 'テールスピット',
        'Tera Slash': 'テラスラッシュ',
        'Tethers': '線',
        'Tidal Wave': 'タイダルウェイブ',
        'Touchdown': 'タッチダウン',
        'Icicle Impact': 'アイシクルインパクト',
        'Spikesicle': 'アイシクルスパイク',
        'Akh Rhai': 'アク・ラーイ',
        'Super Cyclone': 'スーパーサイクロン',
        'Shatter': '破砕',
        'Wormwail': '神龍の咆哮',
        'Benighting Breath': 'ダークネスブレス',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Cocoon': '光茧',
        'Icicle': '冰柱',
        'Left Wing': '左翼',
        'Right Wing': '右翼',
        'Shinryu': '神龙',
        'Tail': '龙尾',
        'The Worm\'s Heart': '神龙的核心',
        'Hakkinryu': '白金龙',
      },
      'replaceText': {
        'Aerial Blast': '大气爆发',
        'Akh Morn': '死亡轮回',
        'Akh Rhai': '天光轮回',
        'Atomic Ray': '原子射线',
        'Benighting Breath': '黑暗吐息',
        'Cocoon Markers': '光茧点名',
        'Dark Matter': '暗物质',
        'Diamond Dust': '钻石星尘',
        'Dragonfist': '龙掌',
        'Earth Breath': '大地吐息',
        'Earthen Fury': '大地之怒',
        'First Wing': '第一只翅膀',
        'Gyre Charge': '螺旋冲锋',
        'Hellfire': '地狱之火炎',
        'Hypernova': '超新星',
        'Icicle Impact': '冰柱冲击',
        'Ice Storm': '吹雪',
        'Judgment Bolt': '制裁之雷',
        'Levinbolt': '闪电',
        'Meteor Impact': '陨石冲击',
        'Phase': '阶段',
        'Protostar': '原恒星',
        'Reiryu Adds': '灵龙出现',
        'Second Wing': '第二只翅膀',
        'Shatter': '破碎',
        'Spikesicle': '冰柱突刺',
        'Summon Icicle': '召唤冰柱',
        'Super Cyclone': '超级气旋',
        'TAP BUTTON OR ELSE': 'XJB按',
        'Tail Marker': '尾巴点名',
        'Tail Slap': '尾部猛击',
        'Tail Spit': '尾部重击',
        'Tera Slash': '万亿斩击',
        'Tethers': '连线',
        'Tidal Wave': '巨浪',
        'Touchdown': '空降',
        'Wormwail': '神龙啸',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Cocoon': '光繭',
        'Icicle': '冰柱',
        'Left Wing': '左翼',
        'Right Wing': '右翼',
        'Shinryu': '神龍',
        'Tail': '龍尾',
        'The Worm\'s Heart': '神龍的核心',
        'Hakkinryu': '白金龍',
      },
      'replaceText': {
        'Aerial Blast': '大氣爆發',
        'Akh Morn': '死亡輪迴',
        'Akh Rhai': '天光輪迴',
        'Atomic Ray': '原子射線',
        'Benighting Breath': '黑暗吐息',
        'Cocoon Markers': '光繭點名',
        'Dark Matter': '黑暗物質',
        'Diamond Dust': '鑽石星塵',
        'Dragonfist': '龍掌',
        'Earth Breath': '大地吐息',
        'Earthen Fury': '大地之怒',
        'First Wing': '第一隻翅膀',
        'Gyre Charge': '螺旋衝鋒',
        'Hellfire': '地獄之火炎',
        'Hypernova': '超新星',
        'Icicle Impact': '冰柱衝擊',
        'Ice Storm': '吹雪',
        'Judgment Bolt': '制裁之雷',
        'Levinbolt': '閃電',
        'Meteor Impact': '隕石衝擊',
        'Phase': '階段',
        'Protostar': '原恆星',
        'Reiryu Adds': '靈龍出現',
        'Second Wing': '第二隻翅膀',
        'Shatter': '破碎',
        'Spikesicle': '冰柱突刺',
        'Summon Icicle': '召喚冰柱',
        'Super Cyclone': '超級颶風',
        'TAP BUTTON OR ELSE': '按按鈕！',
        'Tail Marker': '尾巴點名',
        'Tail Slap': '尾部猛擊',
        'Tail Spit': '尾部重擊',
        'Tera Slash': '萬億斬擊',
        'Tethers': '連線',
        'Tidal Wave': '巨浪',
        'Touchdown': '空降',
        'Wormwail': '神龍嘯',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Hakkinryu': '백금룡',
        'Left Wing': '왼쪽 날개',
        'Right Wing': '오른쪽 날개',
        'Shinryu': '신룡',
        'Tail(?! )': '신룡의 꼬리',
        'The Worm\'s Heart': '신룡의 심핵',
        'Icicle': '고드름',
        'Cocoon': '빛의 고치',
      },
      'replaceText': {
        'T\\/H': '탱/힐',
        'healer[s]*': '힐러',
        'dps': '딜러',
        'tank': '탱커',
        'Aerial Blast': '대기 폭발',
        'Akh Morn': '아크 몬',
        'Atomic Ray': '원자 파동',
        'Cocoon Markers': '빛의 고체 징',
        'Dark Matter': '암흑물질',
        'Diamond Dust': '다이아몬드 더스트',
        'Dragonfist': '용의 손바닥',
        'Earth Breath': '대지의 숨결',
        'Earthen Fury': '대지의 분노',
        'First Wing': '첫번째 날개',
        'Gyre Charge': '회전 돌진',
        'Hellfire': '지옥의 화염',
        'Hypernova': '초신성',
        'Ice Storm': '눈보라',
        'Judgment Bolt': '심판의 벼락',
        'Levinbolt': '우레',
        'Meteor Impact': '운석 낙하',
        'Phase': '페이즈',
        'Protostar': '원시별',
        'Reiryu Adds': '영룡 등장',
        'Second Wing': '두번째 날개',
        'Summon Icicle': '고드름 소환',
        'TAP BUTTON OR ELSE': '긴 급 조 작',
        'Tail Marker': '꼬리 징',
        'Tail Slap': '꼬리치기',
        'Tail Spit': '꼬리 찌르기',
        'Tera Slash': '테라 슬래시',
        'Tethers': '선',
        'Tidal Wave': '해일',
        'Touchdown': '착지',
        'Icicle Impact': '고드름 낙하',
        'Spikesicle': '고드름 돌진',
        'Akh Rhai': '아크 라이',
        'Super Cyclone': '대형 돌개바람',
        'Shatter': '파쇄',
        'Wormwail': '신룡의 포효',
        'Benighting Breath': '어둠의 숨결',
      },
    },
  ],
};

export default triggerSet;
