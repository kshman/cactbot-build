import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Add basically anything to help with the doll charges.
// TODO: Warning for the falling Ferris wheel.
// TODO: Determine safe spots for Tea Awhirl
// TODO: Determine safe spots for Toiling Teapots

export interface Data extends RaidbossData {
  playerIsGhost: boolean;
  solidBitterLinesNext: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'The Strayborough Deadwalk',
  zoneId: ZoneId.TheStrayboroughDeadwalk,
  timelineFile: 'strayborough-deadwalk.txt',
  initData: () => {
    return {
      playerIsGhost: false,
      solidBitterLinesNext: false,
    };
  },
  triggers: [
    {
      id: 'Strayborough Deadwalk Leonogg Malicious Mist',
      type: 'StartsUsing',
      netRegex: { id: '8EB1', source: 'His Royal Headness Leonogg I', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Strayborough Deadwalk Falling Nightmare',
      type: 'Ability',
      netRegex: { id: '8EAE', source: 'His Royal Headness Leonogg I', capture: false },
      infoText: (_data, _matches, output) => output.nightmare!(),
      outputStrings: {
        nightmare: {
          en: 'Avoid nightmare puddles',
          ja: '落ちてくる頭を避ける',
          ko: '나이트메어 장판 피해요',
        },
      },
    },
    {
      id: 'Strayborough Deadwalk Spirited Charge',
      type: 'StartsUsing',
      netRegex: { id: '8EF6', source: 'His Royal Headness Leonogg I', capture: false },
      infoText: (_data, _matches, output) => output.charge!(),
      outputStrings: {
        charge: {
          en: 'Avoid charging dolls',
          ja: '突進してくる人形を避ける',
          ko: '돌진 인형 피해요',
        },
      },
    },
    {
      id: 'Strayborough Deadwalk Evil Scheme',
      type: 'StartsUsing',
      netRegex: { id: '9B02', source: 'His Royal Headness Leonogg I', capture: false },
      infoText: (_data, _matches, output) => output.exaflares!(),
      outputStrings: {
        exaflares: {
          en: 'Avoid exaflares',
          ja: 'エクサフレアを避ける',
          ko: '엑사플레어 피해요',
        },
      },
    },
    {
      id: 'Strayborough Deadwalk Looming Nightmare',
      type: 'HeadMarker',
      netRegex: { id: '00C5' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.chasingPuddles!(),
      outputStrings: {
        chasingPuddles: {
          en: 'Chasing puddles on YOU',
          ja: '自分に AOE 追従',
          ko: '내게 쫒아오는 장판!',
        },
      },
    },
    {
      id: 'Strayborough Deadwalk Last Drop',
      type: 'HeadMarker',
      netRegex: { id: '00DA' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Strayborough Deadwalk Sordid Steam',
      type: 'StartsUsing',
      netRegex: { id: '8F75', source: 'Jack-in-the-Pot', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Strayborough Deadwalk Ghostly Guise Gain',
      type: 'GainsEffect',
      netRegex: { effectId: 'F6D' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.playerIsGhost = true,
    },
    {
      id: 'Strayborough Deadwalk Ghostly Guise Lose',
      type: 'LosesEffect',
      netRegex: { effectId: 'F6D' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.playerIsGhost = false,
    },
    {
      id: 'Strayborough Deadwalk Bitter Regret Middle',
      type: 'StartsUsing',
      netRegex: { id: '9113', source: 'Träumerei', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Strayborough Deadwalk Bitter Regret Sides',
      type: 'StartsUsing',
      netRegex: { id: '9114', source: 'Träumerei', capture: false },
      response: Responses.goMiddle(),
    },
    {
      id: 'Strayborough Deadwalk Ill Intent',
      type: 'StartsUsing',
      netRegex: { id: '9AB7', source: 'Stray Geist' },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.playerIsGhost)
          return output.ghostTether!();
        return output.fleshTether!();
      },
      outputStrings: {
        ghostTether: {
          en: 'Stretch tether',
          ja: '線を伸ばす',
          ko: '줄 늘려요!',
        },
        fleshTether: {
          en: 'Become ghost => stretch tether',
          ja: '幽霊状態になってから => 線を伸ばす',
          ko: '유령으로 🔜 줄 늘려요!',
        },
      },
    },
    {
      id: 'Strayborough Deadwalk Fleshbuster',
      type: 'StartsUsing',
      netRegex: { id: '911C', source: 'Träumerei', capture: false },
      alertText: (data, _matches, output) => {
        if (data.playerIsGhost)
          return;
        return output.becomeGhost!();
      },
      infoText: (data, _matches, output) => {
        if (!data.playerIsGhost)
          return;
        return output.stayGhost!();
      },
      outputStrings: {
        becomeGhost: {
          en: 'Become a ghost',
          ja: '幽霊状態になる',
          ko: '유령으로',
        },
        stayGhost: {
          en: 'Stay a ghost',
          ja: '幽霊状態を維持',
          ko: '그대로 유령으로',
        },
      },
    },
    {
      // Despite this attack having spread marker visuals,
      // it doesn't actually do any damage if done correctly,
      // and stacking two or more has no effect.
      id: 'Strayborough Deadwalk Ghostduster',
      type: 'StartsUsing',
      netRegex: { id: '9119', source: 'Träumerei', capture: false },
      alertText: (data, _matches, output) => {
        if (!data.playerIsGhost)
          return;
        return output.becomeFlesh!();
      },
      infoText: (data, _matches, output) => {
        if (data.playerIsGhost)
          return;
        return output.stayFlesh!();
      },
      outputStrings: {
        becomeFlesh: {
          en: 'Clear ghost status',
          ja: '幽霊状態を解除',
          ko: '사람으로',
        },
        stayFlesh: {
          en: 'Avoid ghost tiles',
          ja: '幽霊床を避ける',
          ko: '사람 그대로 (유령되면 안돼요)',
        },
      },
    },
    {
      id: 'Strayborough Deadwalk Träumerei Malicious Mist',
      type: 'StartsUsing',
      netRegex: { id: '9130', source: 'Träumerei', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      // There are two different Bitter Regret mechanics from adds,
      // both of which use ID 91DC.
      // Fortunately, the two different mechanics are always bracketed by
      // Fleshbuster/Ghostduster and by Impact.
      // Thus, we look for any usage of these three skills and turn
      // the solid lines flag on or off as appropriate.
      id: 'Strayborough Deadwalk Alternate Lines Next',
      type: 'Ability',
      netRegex: { id: ['9119', '911C'], source: 'Träumerei', capture: false },
      run: (data) => data.solidBitterLinesNext = false,
    },
    {
      id: 'Strayborough Deadwalk Solid Lines Next',
      type: 'Ability',
      netRegex: { id: '910D', source: 'Träumerei', capture: false },
      run: (data) => data.solidBitterLinesNext = true,
    },
    {
      id: 'Strayborough Deadwalk Bitter Regret Alternate Lines',
      type: 'StartsUsing',
      netRegex: { id: '91DC', source: 'Stray Phantagenitrix', capture: false },
      condition: (data) => !data.solidBitterLinesNext,
      suppressSeconds: 10, // Don't warn on second set.
      infoText: (_data, _matches, output) => output.dodgeLines!(),
      outputStrings: {
        dodgeLines: {
          en: 'Start mid => Dodge lines',
          ja: '真ん中スタート => 直線を避ける',
          ko: '한가운데 🔜 선 피해요',
        },
      },
    },
    {
      // The lines are 4 units apart on center, in the range 130-166.
      // Centerline is 148 and never has a ghost. Lower values are left, higher values are right.
      id: 'Strayborough Deadwalk Bitter Regret Solid Lines',
      type: 'StartsUsing',
      netRegex: { id: '91DC', source: 'Stray Phantagenitrix' },
      condition: (data) => data.solidBitterLinesNext,
      suppressSeconds: 1, // Multiple instances start casting simultaneously.
      infoText: (_data, matches, output) => {
        const rightUnsafe = Math.round(parseFloat(matches.x)) > 149;
        if (rightUnsafe)
          return output.goLeft!();
        return output.goRight!();
      },
      outputStrings: {
        goRight: Outputs.right,
        goLeft: Outputs.left,
      },
    },
    {
      // As with some other stack lasers in 7.0 content,
      // this doesn't use the head marker log line,
      // instead simply insta-casting an unknown ability on the target.
      // The actual damage ability starts casting alongside.

      // Despite its name, this doesn't seem to be affected
      // by whether or not the targets are ghosts.
      id: 'Strayborough Deadwalk Ghostcrusher',
      type: 'Ability',
      netRegex: { id: '9118', source: 'Träumerei' },
      response: Responses.stackMarkerOn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'His Royal Headness Leonogg I': 'S.K.H Leokopf I.',
        'Jack-in-the-Pot': 'Polteegeist',
        'Noble Noggin': 'selbstlos(?:e|er|es|en) Schönkopf',
        'Spectral Samovar': 'Samowaah',
        'Stray Geist': 'mahrtastisch(?:e|er|es|en) Geist',
        'Stray Phantagenitrix': 'mahrtastisch(?:e|er|es|en) Genetrix',
        'Träumerei': 'Träumerei',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(lines\\)': '(Linien)',
        '\\(middle/sides\\)': '(Mitte/Seiten)',
        '\\(plonk\\)': '(fallen)',
        '\\(sides\\)': '(Seiten)',
        '\\(solid lines\\)': '(feste Linien)',
        'Bitter Regret': 'Bittere Erinnerung',
        'Evil Scheme': 'Verruchtes Vorhaben',
        'Falling Nightmare': 'Albtraum-Stoff',
        'Fleshbuster': 'Lebendes Hack',
        'Ghostcrusher': 'Schwellende Sehnsucht',
        'Ghostduster': 'Geisterbereinigung',
        'Ill Intent': 'Böse Absichten',
        'Impact': 'Begraben',
        'Last Drop': 'Letzter Tropfen',
        'Looming Nightmare': 'Alberner Albtraum',
        'Malicious Mist': 'Niederträchtiger Nebel',
        'Memorial March': 'Parade der Vergessenen',
        'Piping Pour': 'Einschenken',
        'Poltergeist': 'Poltergeist',
        'Scream': 'Schrei',
        'Sordid Steam': 'Dreckiger Dampf',
        'Spirited Charge': 'Mit dem Kopf durch die Wand',
        'Tea Awhirl': 'Gerührt, nicht geschüttelt',
        'Team Spirit': 'Teamgeist',
        'Toiling Teapots': 'Trubel mit Tassen',
        'Tricksome Treat': 'Hinterhältiger Hochgenuss',
        'Troubling Teacups': 'Trubel mit Tassen',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'His Royal Headness Leonogg I': 'Sa Cabochesté Boubouille Ier',
        'Jack-in-the-Pot': 'Diablothé',
        'Noble Noggin': 'Bonne bouille',
        'Spectral Samovar': 'Théière spectrale',
        'Stray Geist': 'Fantôme errant',
        'Stray Phantagenitrix': 'Maman fantôme errante',
        'Träumerei': 'Träumerei',
      },
      'replaceText': {
        '\\(cast\\)': '(Incante)',
        '\\(lines\\)': '(Lignes)',
        '\\(middle/sides\\)': '(Milieu/Côtés)',
        '\\(plonk\\)': '(Tombe)',
        '\\(sides\\)': '(Côtés)',
        '\\(solid lines\\)': '(Lignes solides)',
        'Bitter Regret': 'Souvenirs amers',
        'Evil Scheme': 'Plan machiavélique',
        'Falling Nightmare': 'Chute cauchemardesque',
        'Fleshbuster': 'Hachoir à chair',
        'Ghostcrusher': 'Lourde réminiscence',
        'Ghostduster': 'Purgation de spectre',
        'Ill Intent': 'Paire fatale',
        'Impact': 'Impact',
        'Last Drop': 'Dernière goutte',
        'Looming Nightmare': 'Terrain cauchemardesque',
        'Malicious Mist': 'Brume malfaisante',
        'Memorial March': 'Parade mémoriale',
        'Piping Pour': 'Service',
        'Poltergeist': 'Esprit frappeur',
        'Scream': 'Cri',
        'Sordid Steam': 'Plan machiavélique',
        'Spirited Charge': 'Ordre d\'attaque',
        'Tea Awhirl': 'Tasses tournantes',
        'Team Spirit': 'Esprit d\'équipe',
        'Toiling Teapots': 'Théières meurtrières',
        'Tricksome Treat': 'Diable en tasse',
        'Troubling Teacups': 'Tasses d\'ectoplasme',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'His Royal Headness Leonogg I': 'ノッギン・ザ・ナイスヘッド',
        'Jack-in-the-Pot': 'ジャック・イン・ザ・ポット',
        'Noble Noggin': 'ナイスヘッド',
        'Spectral Samovar': 'スペクトラル・サモワール',
        'Stray Geist': 'ストレイ・ゴースト',
        'Stray Phantagenitrix': 'ストレイ・マザーゴースト',
        'Träumerei': 'トロイメライ',
      },
      'replaceText': {
        '\\(cast\\)': '(詠唱)',
        '\\(lines 1\\)': '(直線床 1)',
        '\\(lines 2\\)': '(直線床 2)',
        '\\(middle/sides\\)': '(中央/両端)',
        '\\(plonk\\)': '(落下)',
        '\\(sides\\)': '(両端)',
        '\\(solid lines\\)': '(半面床)',
        'Bitter Regret': 'ビターメモリーズ',
        'Evil Scheme': 'イービルスキーム',
        'Falling Nightmare': 'ナイトメアフォール',
        'Fleshbuster': 'リビングスライサー',
        'Ghostcrusher': 'ヘビーメモリーズ',
        'Ghostduster': 'ゴーストダスター',
        'Ill Intent': 'イービルソート',
        'Impact': '衝撃',
        'Last Drop': 'ラストドロップ',
        'Looming Nightmare': 'ナイトメアルーム',
        'Malicious Mist': 'イービルミスト',
        'Memorial March': 'メモリアルパレード',
        'Piping Pour': 'サーブ',
        'Poltergeist': 'ポルターガイスト',
        'Scream': 'スクリーム',
        'Sordid Steam': 'イービルスチーム',
        'Spirited Charge': '突撃命令',
        'Tea Awhirl': 'ティーアホワール',
        'Team Spirit': 'チームスピリット',
        'Toiling Teapots': 'ティーポット',
        'Tricksome Treat': 'トリックサム・トリート',
        'Troubling Teacups': 'ティーカップ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'His Royal Headness Leonogg I': '好脑袋大王',
        'Jack-in-the-Pot': '茶壶里的小丑',
        'Noble Noggin': '好脑袋',
        'Spectral Samovar': '幻光茶壶',
        'Stray Geist': '迷途的幽灵',
        'Stray Phantagenitrix': '迷途的幽灵之母',
        'Träumerei': '梦像',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(lines\\)': '(直线)',
        '\\(middle/sides\\)': '(中间/两侧)',
        '\\(plonk\\)': '(砸下)',
        '\\(sides\\)': '(两侧)',
        '\\(solid lines\\)': '(半场)',
        'Bitter Regret': '消极回忆',
        'Evil Scheme': '邪恶诡计',
        'Falling Nightmare': '噩梦降临',
        'Fleshbuster': '戮肉',
        'Ghostcrusher': '沉重回忆',
        'Ghostduster': '除灵',
        'Ill Intent': '邪念',
        'Impact': '冲击',
        'Last Drop': '最后一滴',
        'Looming Nightmare': '噩梦逼近',
        'Malicious Mist': '邪恶迷雾',
        'Memorial March': '悼念游行',
        'Piping Pour': '倒茶',
        'Poltergeist': '骚灵',
        'Scream': '尖啸',
        'Sordid Steam': '邪恶蒸汽',
        'Spirited Charge': '突击命令',
        'Tea Awhirl': '旋转茶杯',
        'Team Spirit': '合作神精',
        'Toiling Teapots': '茶壶',
        'Tricksome Treat': '捣蛋式款待',
        'Troubling Teacups': '茶杯',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'His Royal Headness Leonogg I': '好腦袋大王',
        'Jack-in-the-Pot': '茶壺裡的小丑',
        'Noble Noggin': '好腦袋',
        'Spectral Samovar': '幻光茶壺',
        'Stray Geist': '迷途的幽靈',
        'Stray Phantagenitrix': '迷途的幽靈之母',
        'Träumerei': '夢像',
      },
      'replaceText': {
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        // '\\(lines\\)': '', // FIXME '(直线)'
        // '\\(middle/sides\\)': '', // FIXME '(中间/两侧)'
        // '\\(plonk\\)': '', // FIXME '(砸下)'
        // '\\(sides\\)': '', // FIXME '(两侧)'
        // '\\(solid lines\\)': '', // FIXME '(半场)'
        'Bitter Regret': '消極回憶',
        'Evil Scheme': '邪惡詭計',
        'Falling Nightmare': '惡夢降臨',
        'Fleshbuster': '戮肉',
        'Ghostcrusher': '沉重回憶',
        'Ghostduster': '除靈',
        'Ill Intent': '邪念',
        'Impact': '塌方',
        'Last Drop': '最後一滴',
        'Looming Nightmare': '惡夢逼近',
        'Malicious Mist': '邪霧',
        'Memorial March': '悼念遊行',
        'Piping Pour': '倒茶',
        'Poltergeist': '喧囂鬼',
        'Scream': '尖嘯',
        'Sordid Steam': '邪惡蒸氣',
        'Spirited Charge': '突擊命令',
        'Tea Awhirl': '旋轉茶杯',
        'Team Spirit': '合作神精',
        'Toiling Teapots': '茶壺',
        'Tricksome Treat': '搗蛋式款待',
        'Troubling Teacups': '茶杯',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'His Royal Headness Leonogg I': '멋진 머리 노긴',
        'Jack-in-the-Pot': '주전자 잭',
        'Noble Noggin': '멋진 머리',
        'Spectral Samovar': '유령 주전자',
        'Stray Geist': '헤매는 유령',
        'Stray Phantagenitrix': '헤매는 엄마 유령',
        'Träumerei': '트로이메라이',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(lines 1\\)': '(직선장판 1)',
        '\\(lines 2\\)': '(직선장판 2)',
        '\\(middle/sides\\)': '(중앙/양옆)',
        '\\(plonk\\)': '(떨어짐)',
        '\\(sides\\)': '(양옆)',
        '\\(solid lines\\)': '(절반)',
        'Bitter Regret': '부정적인 기억',
        'Evil Scheme': '사악한 계획',
        'Falling Nightmare': '악몽 낙하',
        'Fleshbuster': '육체 절단',
        'Ghostcrusher': '무거운 기억',
        'Ghostduster': '유령 청소',
        'Ill Intent': '사악한 연기',
        'Impact': '충격',
        'Last Drop': '마지막 한 방울',
        'Looming Nightmare': '악몽의 방',
        'Malicious Mist': '사악한 안개',
        'Memorial March': '기념 행진',
        'Piping Pour': '찻물 따르기',
        'Poltergeist': '폴터가이스트',
        'Scream': '절규',
        'Sordid Steam': '사악한 증기',
        'Spirited Charge': '돌격 명령',
        'Tea Awhirl': '찻잔 돌리기',
        'Team Spirit': '영혼 소집',
        'Toiling Teapots': '찻주전자',
        'Tricksome Treat': '깜짝 놀랐지',
        'Troubling Teacups': '찻잔',
      },
    },
  ],
};

export default triggerSet;
