Options.Triggers.push({
  id: 'TheDiadem',
  zoneId: ZoneId.TheDiadem,
  comments: {
    en: 'Inactivity warning and timed node spawn alert',
  },
  resetWhenOutOfCombat: false,
  triggers: [
    // https://xivapi.com/LogMessage/916
    // en: 7 minutes have elapsed since your last activity. [...]
    // There is no network packet for these log lines; so have to use GameLog.
    {
      id: 'Diadem Falling Asleep',
      type: 'GameLog',
      netRegex: { line: '7 minutes have elapsed since your last activity..*?', capture: false },
      response: Responses.wakeUp(),
    },
    // There is presumably a network packet to, at a minimum, spawn the legendary node.
    // But currently no associated log line other than GameLog (code: 003B).
    {
      id: 'Diadem Found Gather Point',
      type: 'GameLog',
      netRegex: {
        line:
          'You sense a grade .* clouded (?:mineral deposit|rocky outcrop|mature tree|lush vegetation patch).*?',
        capture: false,
      },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Found clouded gather point',
          de: 'Verhüllte Sammlerstelle gefunden',
          fr: 'Point de récolte évanescent détecté',
          ja: '幻の採集場探したよ！',
          cn: '梦幻采集点刷了！冲鸭！！',
          ko: '클라우드 채집 위치 발견',
        },
      },
    },
    // This one specifically uses player chat, so no replacement log line.
    {
      id: 'Diadem Flag Alert',
      type: 'GameLog',
      netRegex: { line: '.*\ue0bbThe Diadem *?', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Check coordinate on chat',
          de: 'Überprüfe die Koordinaten im Chat',
          fr: 'Vérifier les coordonnées sur le Tchat',
          ja: 'チャットに座標を確認',
          cn: '检查聊天栏中的坐标',
          ko: '채팅에 좌표 올라왔어요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?':
          'Seit deiner letzten Aktivität sind 7 Minuten vergangen.',
        'The Diadem': 'Das Diadem',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        '7 minutes have elapsed since your last activity.':
          'Votre personnage est inactif depuis 7 minutes',
        'The Diadem': 'Le Diadème',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        '7 minutes have elapsed since your last activity.': '操作がない状態になってから7分が経過しました。',
        'The Diadem': 'ディアデム諸島',
      },
    },
    {
      'locale': 'cn',
      'missingTranslations': true,
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?': '已经7分钟没有进行任何操作',
        'The Diadem': '云冠群岛',
      },
    },
    {
      'locale': 'ko',
      'missingTranslations': true,
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?': '7분 동안 아무 조작을 하지 않았습니다',
        'The Diadem': '디아뎀 제도',
      },
    },
  ],
});
