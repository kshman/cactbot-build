import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  finalPhase?: boolean;
}

// Shinryu Normal
const triggerSet: TriggerSet<Data> = {
  id: 'TheRoyalMenagerie',
  zoneId: ZoneId.TheRoyalMenagerie,
  timelineFile: 'shinryu.txt',
  triggers: [
    {
      id: 'Shinryu Normal Akh Morn',
      type: 'StartsUsing',
      netRegex: { id: '1FA4', source: 'Shinryu' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.akhMornOnYou!();
        else if (data.role === 'tank')
          return output.akhMornOn!({ player: data.party.member(matches.target) });
      },
      infoText: (data, matches, output) => {
        // Nobody with Akh Morn is a direct target for Akh Rai,
        // and tanks should never be targeted for it.
        // Additionally, Akh Rai happens only after the intermission.
        if (matches.target === data.me || data.role === 'tank' || !data.finalPhase)
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
      id: 'Shinryu Normal Diamond Dust',
      type: 'StartsUsing',
      netRegex: { id: '1FAD', source: 'Shinryu' },
      // Here and elsewhere, timings aren't always completely usable. Instead we give the user
      // a quasi-standard amount of time when notifying.
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      response: Responses.stopMoving(),
    },
    {
      id: 'Shinryu Normal Dragonfist',
      type: 'StartsUsing',
      netRegex: { id: '24EF', source: 'Shinryu', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out of middle',
          ja: '中央から離れる',
          ko: '한가운데 피해요',
        },
      },
    },
    {
      id: 'Shinryu Normal Hellfire',
      type: 'StartsUsing',
      netRegex: { id: '1FAB', source: 'Shinryu', capture: false },
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
      id: 'Shinryu Normal Hypernova',
      type: 'StartsUsing',
      netRegex: { id: ['1F99', '1F9A'], source: 'Right Wing', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack in water',
          ja: '水に集合',
          ko: '물에서 뭉쳐요',
        },
      },
    },
    {
      id: 'Shinryu Normal Judgement Bolt',
      type: 'StartsUsing',
      netRegex: { id: '1FAC', source: 'Shinryu', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'out of water',
          ja: '水から離れる',
          ko: '물 밖으로',
        },
      },
    },
    {
      id: 'Shinryu Normal Levinbolt',
      type: 'StartsUsing',
      netRegex: { id: '1F9B', source: 'Right Wing', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread out, no water',
          ja: '散開、水に入らない',
          ko: '흩어져요, 물에는 들어가지 말고',
        },
      },
    },
    {
      id: 'Shinryu Normal Tidal Wave',
      type: 'StartsUsing',
      netRegex: { id: '1FAA', source: 'Shinryu' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
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
      id: 'Shinryu Normal Ice Storm',
      type: 'StartsUsing',
      netRegex: { id: '1FA2', source: 'Left Wing' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      response: Responses.aoe(),
    },
    {
      id: 'Shinryu Normal Tail Slap',
      type: 'StartsUsing',
      netRegex: { id: '1F93', source: 'Tail', capture: false },
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
      // Re-using the Gyre Charge triggers since they're convenient and already translated.
      id: 'Shinryu Normal Akh Rai Activation',
      type: 'StartsUsing',
      netRegex: { id: '1FF4', source: 'Shinryu', capture: false },
      condition: (data) => !data.finalPhase,
      run: (data) => data.finalPhase = true,
    },
    {
      id: 'Shinryu Normal Divebomb',
      type: 'StartsUsing',
      netRegex: { id: '1FF4', source: 'Shinryu', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'avoid divebomb',
          ja: 'ダイブボムを避ける',
          ko: '다이브밤 피해요',
        },
      },
    },
    {
      id: 'Shinryu Normal Tethers',
      type: 'HeadMarker',
      netRegex: { id: '0061' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 3.8,
      response: Responses.breakChains(),
    },
    {
      // There doesn't really seem to be any verified information about this marker.
      // It usually appears around Burning Chains, but it's wildly inconsistent.
      // However, it *seems* that the tail attacks from the side the target is on.
      id: 'Shinryu Normal Slap Marker',
      type: 'HeadMarker',
      netRegex: { id: '0062' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait onto unbroken squares',
          ja: '壊れなかった床に誘導',
          ko: '안부셔진 바닥으로 꼬리 치기 유도',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Cocoon': 'Lichtsphäre',
        'Left Wing': 'link(?:e|er|es|en) Schwinge',
        'Right Wing': 'recht(?:e|er|es|en) Schwinge',
        'Shinryu': 'Shinryu',
        'Tail': 'Schwanz',
        'Icicle': 'Eiszapfen',
      },
      'replaceText': {
        'Akh Morn': 'Akh Morn',
        'Elemental Attack': 'Elemental Attack',
        'Dark Matter': 'Dunkelmaterie',
        'Dragonfist': 'Drachenfaust',
        'Earth Breath': 'Erdatem',
        'Gyre Charge': 'Wirbel-Aufladung',
        'Hellfire': 'Höllenfeuer',
        'Hypernova': 'Supernova',
        'Ice Storm': 'Eissturm',
        'Icicle Impact': 'Eiszapfen-Schlag',
        'Judgment Bolt': 'Ionenschlag',
        'Levinbolt': 'Keraunisches Feld',
        'Meteor Impact': 'Meteoreinschlag',
        'Protostar': 'Protostern',
        'Spikesicle': 'Eislanze',
        'Summon Icicle': 'Flugeis',
        'TAP BUTTON OR ELSE': 'DRÜCKE TASTEN ETC',
        'Tail Slap': 'Schweifklapser',
        'Tidal Wave': 'Flutwelle',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Cocoon': 'cocon de lumière',
        'Icicle': 'stalactite',
        'Left Wing': 'aile gauche',
        'Right Wing': 'aile droite',
        'Shinryu': 'Shinryu',
        'Tail': 'queue',
      },
      'replaceText': {
        'Akh Morn': 'Akh Morn',
        'Elemental Attack': 'Attaque élémentaire',
        'Dark Matter': 'Matière sombre',
        'Dragonfist': 'Poing dragon',
        'Earth Breath': 'Souffle de terre',
        'Gyre Charge': 'Gyrocharge',
        'Hellfire': 'Flammes de l\'enfer',
        'Hypernova': 'Hypernova',
        'Ice Storm': 'Tempête de glace',
        'Icicle Impact': 'Impact de stalactite',
        'Judgment Bolt': 'Éclair du jugement',
        'Levinbolt': 'Fulguration',
        'Meteor Impact': 'Impact de météore',
        'Protostar': 'Proto-étoile',
        'Spikesicle': 'Stalactopointe',
        'Summon Icicle': 'Appel de stalactite',
        'Tail Slap': 'Gifle caudale',
        'TAP BUTTON OR ELSE': 'CLIQUEZ SUR LE BOUTON OU AUTRE',
        'Tidal Wave': 'Raz-de-marée',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Cocoon': '光の繭',
        'Left Wing': 'レフトウィング',
        'Right Wing': 'ライトウィング',
        'Shinryu': '神龍',
        'Tail': '神龍の尾',
        'Icicle': 'アイシクル',
      },
      'replaceText': {
        'Akh Morn': 'アク・モーン',
        'Elemental Attack': 'エレメンタル攻撃',
        'Dark Matter': 'ダークマター',
        'Dragonfist': '龍掌',
        'Earth Breath': 'アースブレス',
        'Gyre Charge': 'ジャイヤチャージ',
        'Hellfire': '地獄の火炎',
        'Hypernova': 'スーパーノヴァ',
        'Ice Storm': '吹雪',
        'Icicle Impact': 'アイシクルインパクト',
        'Judgment Bolt': '裁きの雷',
        'Levinbolt': '稲妻',
        'Meteor Impact': 'メテオインパクト',
        'Protostar': 'プロトスター',
        'Spikesicle': 'アイシクルスパイク',
        'Summon Icicle': 'サモン・アイシクル',
        'TAP BUTTON OR ELSE': 'ボタンを押せ！',
        'Tail Slap': 'テールスラップ',
        'Tidal Wave': 'タイダルウェイブ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Cocoon': '光茧',
        'Left Wing': '左翼',
        'Right Wing': '右翼',
        'Shinryu': '神龙',
        'Tail': '龙尾',
        'Icicle': '冰柱',
      },
      'replaceText': {
        'Akh Morn': '死亡轮回',
        'Elemental Attack': '元素攻击',
        'Dark Matter': '暗物质',
        'Dragonfist': '龙掌',
        'Earth Breath': '大地吐息',
        'Gyre Charge': '螺旋冲锋',
        'Hellfire': '地狱之火炎',
        'Hypernova': '超新星',
        'Ice Storm': '吹雪',
        'Icicle Impact': '冰柱冲击',
        'Judgment Bolt': '制裁之雷',
        'Levinbolt': '闪电',
        'Meteor Impact': '陨石冲击',
        'Protostar': '原恒星',
        'Spikesicle': '冰柱突刺',
        'Summon Icicle': '召唤冰柱',
        'TAP BUTTON OR ELSE': 'XJB按',
        'Tail Slap': '尾部猛击',
        'Tidal Wave': '巨浪',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Cocoon': '光繭',
        'Left Wing': '左翼',
        'Right Wing': '右翼',
        'Shinryu': '神龍',
        'Tail': '龍尾',
        'Icicle': '冰柱',
      },
      'replaceText': {
        'Akh Morn': '死亡輪迴',
        'Elemental Attack': '元素攻擊',
        'Dark Matter': '黑暗物質',
        'Dragonfist': '龍掌',
        'Earth Breath': '大地吐息',
        'Gyre Charge': '螺旋衝鋒',
        'Hellfire': '地獄之火炎',
        'Hypernova': '超新星',
        'Ice Storm': '吹雪',
        'Icicle Impact': '冰柱衝擊',
        'Judgment Bolt': '制裁之雷',
        'Levinbolt': '閃電',
        'Meteor Impact': '隕石衝擊',
        'Protostar': '原恆星',
        'Spikesicle': '冰柱突刺',
        'Summon Icicle': '召喚冰柱',
        'TAP BUTTON OR ELSE': '按按鈕！',
        'Tail Slap': '尾部猛擊',
        'Tidal Wave': '巨浪',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Cocoon': '빛의 고치',
        'Left Wing': '왼쪽 날개',
        'Right Wing': '오른쪽 날개',
        'Shinryu': '신룡',
        'Tail(?! )': '신룡의 꼬리',
      },
      'replaceText': {
        'Akh Morn': '아크 몬',
        'Dark Matter': '암흑물질',
        'Dragonfist': '용의 손바닥',
        'Elemental Attack': '원소 공격',
        'Earth Breath': '대지의 숨결',
        'Gyre Charge': '회전 돌진',
        'Hellfire': '지옥의 화염',
        'Hypernova': '초신성',
        'Ice Storm': '눈보라',
        'Icicle Impact': '고드름 낙하',
        'Judgment Bolt': '심판의 벼락',
        'Levinbolt': '우레',
        'Meteor Impact': '운석 낙하',
        'Protostar': '원시별',
        'Spikesicle': '고드름 돌진',
        'Summon Icicle': '고드름 소환',
        'TAP BUTTON OR ELSE': '긴 급 조 작',
        'Tail Slap': '꼬리치기',
        'Tidal Wave': '해일',
      },
    },
  ],
};

export default triggerSet;
