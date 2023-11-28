const eulogiaFormMap = {
  // first
  '8A0A': 'left',
  '8A0D': 'right',
  '8A10': 'inside',
  // second
  '8A0B': 'left',
  '8A0E': 'right',
  '8A11': 'inside',
  // third
  '8A0C': 'left',
  '8A0F': 'right',
  '8A12': 'inside',
};
Options.Triggers.push({
  id: 'Thaleia',
  zoneId: ZoneId.Thaleia,
  timelineFile: 'thaleia.txt',
  initData: () => {
    return {
      busterTargets: [],
      soaringMinuet: false,
      eulogiaForms: [],
    };
  },
  timelineTriggers: [
    {
      id: 'Thaleia Thaliak Rheognosis Knockback',
      regex: /^Rheognosis$/,
      beforeSeconds: 5,
      suppressSeconds: 5,
      response: Responses.knockback(),
    },
  ],
  triggers: [
    {
      id: 'Thaleia Thaliak Katarraktes',
      type: 'StartsUsing',
      netRegex: { id: '88D1', source: 'Thaliak', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Thaliak Thlipsis',
      type: 'StartsUsing',
      netRegex: { id: '88D8', source: 'Thaliak' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Thaleia Thaliak Left Bank',
      type: 'StartsUsing',
      netRegex: { id: '88D2', source: 'Thaliak', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Thaleia Thaliak Right Bank',
      type: 'StartsUsing',
      netRegex: { id: '88D3', source: 'Thaliak', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Thaleia Thaliak Left Bank Hieroglyphika',
      type: 'StartsUsing',
      netRegex: { id: '8C2C', source: 'Thaliak', capture: false },
      delaySeconds: 12,
      response: Responses.goRight(),
    },
    {
      id: 'Thaleia Thaliak Right Bank Hieroglyphika',
      type: 'StartsUsing',
      netRegex: { id: '8C2D', source: 'Thaliak', capture: false },
      delaySeconds: 12,
      response: Responses.goLeft(),
    },
    {
      id: 'Thaleia Thaliak Hydroptosis',
      type: 'StartsUsing',
      netRegex: { id: '88D5', source: 'Thaliak' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Thaleia Thaliak Rhyton',
      type: 'HeadMarker',
      netRegex: { id: '01D7' },
      delaySeconds: (data, matches) => {
        data.busterTargets.push(matches.target);
        return data.busterTargets.length === 3 ? 0 : 0.5;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankCleaveOnYou: Outputs.tankCleaveOnYou,
          tankCleaves: Outputs.tankBusterCleaves,
        };
        if (data.busterTargets.length === 0)
          return;
        if (!data.busterTargets.includes(data.me))
          return { infoText: output.tankCleaves() };
        if (data.role !== 'tank' && data.job !== 'BLU')
          return { alarmText: output.tankCleaveOnYou() };
        return { alertText: output.tankCleaveOnYou() };
      },
      run: (data) => data.busterTargets = [],
    },
    {
      id: 'Thaleia Thaliak Rheognosis',
      type: 'StartsUsing',
      netRegex: { id: '88C4', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Look for knockback position',
          de: 'Nach Rückstoß Position schauen',
          fr: 'Repérez la zone de poussée',
          ja: 'ノックバック位置へ',
          ko: '넉백쪽으로',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Rheognosis Petrine',
      type: 'StartsUsing',
      netRegex: { id: '88C5', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback + Rolling stones',
          de: 'Rückstoß + rollende Steine',
          fr: 'Poussée + Rocher',
          ja: 'ノックバック + 石AOE',
          ko: '넉백 + 돌 굴러와요',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Hieroglyphika',
      type: 'StartsUsing',
      netRegex: { id: '88CF', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to rotated safe zone',
          de: 'Geh zum sichere Feld',
          fr: 'Allez dans une zone sûre',
          ja: '安置へ移動',
          ko: '안전한 곳으로',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Tempest',
      type: 'StartsUsing',
      netRegex: { id: '880B', source: 'Llymlaen', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Llymlaen Seafoam Spiral',
      type: 'StartsUsing',
      netRegex: { id: '880D', source: 'Llymlaen', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Thaleia Llymlaen Wind Rose',
      type: 'StartsUsing',
      netRegex: { id: '880C', source: 'Llymlaen', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Thaleia Llymlaen Navigator\'s Trident Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8811', source: 'Llymlaen', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback',
          de: 'Rückstoß',
          fr: 'Poussée',
          ja: 'まもなくノックバック',
          ko: '곧 넉백',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Surging Wave',
      type: 'StartsUsing',
      netRegex: { id: '8812', source: 'Llymlaen', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Far knockback',
          de: 'Weiter Rückstoß',
          fr: 'Poussée au loin',
          ja: '遠くノックバック',
          ko: '멀리 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Left Strait',
      type: 'StartsUsing',
      netRegex: { id: '8851', source: 'Llymlaen', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Thaleia Llymlaen Right Strait',
      type: 'StartsUsing',
      netRegex: { id: '8852', source: 'Llymlaen', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Thaleia Llymlaen Deep Dive',
      type: 'StartsUsing',
      netRegex: { id: ['8819', '8834'], source: 'Llymlaen' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Thaleia Llymlaen Stormwinds',
      type: 'StartsUsing',
      netRegex: { id: '881F', source: 'Llymlaen' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Thaleia Llymlaen Torrential Tridents',
      type: 'StartsUsing',
      netRegex: { id: '881A', source: 'Llymlaen', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Last trident => 1st trident',
          de: 'Letzer Dreizack => erster Dreizack',
          fr: 'Dernier trident -> 1er trident',
          ja: '最後の槍 => 1番目の槍へ',
          ko: '마지막 창 🔜 첫번째 창으로',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Godsbane',
      type: 'StartsUsing',
      netRegex: { id: '8824', source: 'Llymlaen', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'Thaleia Oschon Sudden Downpour',
      type: 'StartsUsing',
      netRegex: { id: ['8999', '899A'], source: 'Oschon', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Oschon Trek Shot',
      type: 'StartsUsing',
      netRegex: { id: '898E', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to side of the arrow (Boss doesn\'t move)',
          de: 'Geh seitlich des Pfeils (Boss bewegt sich nicht)',
          fr: 'Allez sur les côtés de la flèche (le boss ne bouge pas)',
          ja: '矢印の横へ (ボスは動かない)',
          ko: '화살표 찾아서 옆으로 (보스 안따라옴)',
        },
      },
    },
    {
      id: 'Thaleia Oschon Reproduce',
      type: 'StartsUsing',
      netRegex: { id: '8989', source: 'Oschon', capture: false },
      alertText: (data, _matches, output) => {
        if (!data.soaringMinuet)
          return output.one();
        return output.two();
      },
      outputStrings: {
        one: {
          en: 'Go to side of the arrow',
          de: 'Geh seitlich des Pfeils',
          fr: 'Allez sur les côtés de la flèche',
          ja: '矢印の横へ',
          ko: '화살표 찾아서 옆으로 (보스 따라옴)',
        },
        two: {
          en: 'Corner between two arrows',
          de: 'Ecke zwichen 2 Pfeilen',
          fr: 'Coin entre les 2 flèches',
          ja: '2つの矢印の隅',
          ko: '두 화살표 사이가 안전 (보스 따라옴)',
        },
      },
    },
    {
      id: 'Thaleia Oschon Flinted Foehn',
      type: 'HeadMarker',
      netRegex: { id: '013C' },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.stackMarkerOnYou();
        return output.stackMarkerOn({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        stackMarkerOn: {
          en: '6x Stack on ${player}',
          ja: '6x 全体攻撃: ${player}',
          ko: '6x 전체 공격: ${player}',
        },
        stackMarkerOnYou: {
          en: '6x Stack on You',
          ja: '自分に6x全体攻撃',
          ko: '내게 6x 전체 공격',
        },
      },
    },
    {
      id: 'Thaleia Oschon Soaring Minuet',
      type: 'StartsUsing',
      netRegex: { id: ['8D0E', '8994'], source: 'Oschon', capture: false },
      response: Responses.getBehind(),
      run: (data) => data.soaringMinuet = true,
    },
    {
      id: 'Thaleia Oschon The Arrow / Eulogia Sunbeam',
      // 0158 = The Arrow (small)
      // 0158 = Eulogia Sunbeam
      // 01F4 = The Arrow (big)
      type: 'HeadMarker',
      netRegex: { id: ['0158', '01F4'] },
      delaySeconds: (data, matches) => {
        data.busterTargets.push(matches.target);
        return data.busterTargets.length === 3 ? 0 : 0.5;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankCleaveOnYou: Outputs.tankCleaveOnYou,
          tankCleaves: Outputs.tankBusterCleaves,
        };
        if (data.busterTargets.length === 0)
          return;
        if (!data.busterTargets.includes(data.me))
          return { infoText: output.tankCleaves() };
        if (data.role !== 'tank' && data.job !== 'BLU')
          return { alarmText: output.tankCleaveOnYou() };
        return { alertText: output.tankCleaveOnYou() };
      },
      run: (data) => data.busterTargets = [],
    },
    {
      id: 'Thaleia Oschon Climbing Shot',
      type: 'StartsUsing',
      netRegex: { id: ['8990', '8991', '8992', '8993'], source: 'Oschon', capture: false },
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback to safe corner',
          de: 'Rückstoß in die sichere Ecke',
          fr: 'Poussée vers un coin sûr',
          ja: 'AOEがないどころへ + ノックバック',
          ko: '장판 없는 곳으로 + 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Lofty Peaks',
      type: 'StartsUsing',
      netRegex: { id: '89A7', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '(second phase)',
          de: 'Oschon zweite Phase',
          fr: 'Oshon : deuxième phase',
          ja: 'すぐ大きくなる',
          ko: '인제 곧 커져요! 버프 넣지말것!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Piton Pull NE/SW',
      type: 'StartsUsing',
      netRegex: { id: '89A9', source: 'Oschon', capture: false },
      alertText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.text({ front: output.arrowNE(), back: output.arrowSW() });
        return output.text({ front: output.dirNE(), back: output.dirSW() });
      },
      outputStrings: {
        text: {
          en: '${front} / ${back}',
        },
        dirNE: Outputs.dirNE,
        dirSW: Outputs.dirSW,
        arrowNE: Outputs.arrowNE,
        arrowSW: Outputs.arrowSW,
      },
    },
    {
      id: 'Thaleia Oschon Piton Pull NW/SE',
      type: 'StartsUsing',
      netRegex: { id: '89AA', source: 'Oschon', capture: false },
      alertText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.text({ front: output.arrowNW(), back: output.arrowSE() });
        return output.text({ front: output.dirNW(), back: output.dirSE() });
      },
      outputStrings: {
        text: {
          en: '${front} / ${back}',
        },
        dirNW: Outputs.dirNW,
        dirSE: Outputs.dirSE,
        arrowNW: Outputs.arrowNW,
        arrowSE: Outputs.arrowSE,
      },
    },
    {
      id: 'Thaleia Oschon Altitude',
      type: 'StartsUsing',
      netRegex: { id: '89AF', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to safe zone',
          de: 'Geh in den sicheren Bereich',
          fr: 'Allez dans une zone sûre',
          ja: '安置で待機',
          ko: '안전한 곳 찾아요!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Wandering Shot North',
      type: 'StartsUsing',
      netRegex: { id: '8CF6', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'South (away from orb)',
          ja: '南、玉からはなれて',
          ko: '남쪽! 구슬에서 먼곳으로!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Wandering Shot South',
      type: 'StartsUsing',
      netRegex: { id: '8CF7', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'North (away from orb)',
          ja: '北、玉からはなれて',
          ko: '북쪽! 구슬에서 먼곳으로!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Wandering Volley North',
      type: 'StartsUsing',
      netRegex: { id: '89AC', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback to south safe spot',
          ja: '南、安置へノックバック',
          ko: '남쪽! 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Wandering Volley South',
      type: 'StartsUsing',
      netRegex: { id: '89AD', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback to north safe spot',
          ja: '北、安置へノックバック',
          ko: '북쪽! 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Dawn of Time',
      type: 'StartsUsing',
      netRegex: { id: '8A03', source: 'Eulogia', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Eulogia Forms',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(eulogiaFormMap), source: 'Eulogia' },
      durationSeconds: (data) => data.eulogiaForms.length < 2 ? 4 : 19,
      infoText: (data, matches, output) => {
        const form = eulogiaFormMap[matches.id.toUpperCase()] ?? 'unknown';
        data.eulogiaForms.push(form);
        if (data.eulogiaForms.length === 3) {
          const [form1, form2, form3] = data.eulogiaForms.map((x) => output[x]());
          data.eulogiaForms = [];
          return output.text({ form1: form1, form2: form2, form3: form3 });
        }
        return output[form]();
      },
      outputStrings: {
        text: {
          en: '${form1} => ${form2} => ${form3}',
          de: '${form1} => ${form2} => ${form3}',
          fr: '${form1} => ${form2} => ${form3}',
          ja: '${form1} => ${form2} => ${form3}',
          ko: '${form1} 🔜 ${form2} 🔜 ${form3}',
        },
        left: Outputs.left,
        right: Outputs.right,
        inside: Outputs.in,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Thaleia Eulogia the Whorl',
      type: 'StartsUsing',
      netRegex: { id: '8A2F', source: 'Eulogia', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Thaleia Eulogia Love\'s Light',
      type: 'StartsUsing',
      netRegex: { id: '8A30', source: 'Eulogia', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Start from the bright moon',
          de: 'Starte vom hellen Mond',
          fr: 'Commencez depuis la lune pleine',
          ja: '明るい月から',
          ko: '밝은 것부터 터져요 🔜 하나씩 이동',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hydrostasis',
      type: 'StartsUsing',
      netRegex: { id: '8A37', source: 'Eulogia', capture: false },
      durationSeconds: 13,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '3 => 1 => 2',
          de: '3 => 1 => 2',
          fr: '3 -> 1 -> 2',
          ja: '3 => 1 => 2',
          ko: '3 🔜 1 🔜 2',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hieroglyphika',
      type: 'StartsUsing',
      netRegex: { id: '8A43', source: 'Eulogia', capture: false },
      durationSeconds: 20,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to rotated safe zone',
          de: 'Geh in den sicheren Bereich',
          fr: 'Allez dans une zone sûre',
          ja: '安置へ移動',
          ko: '안전한 곳으로',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hand of the Destroyer Red',
      type: 'StartsUsing',
      netRegex: { id: '8A47', source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Be on blue half',
          de: 'Geh zur blauen Seite',
          fr: 'Placez-vous sur la moitié bleue',
          ja: '青い安置',
          cn: '站蓝色半场',
          ko: '파랑쪽이 안전',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hand of the Destroyer Blue',
      type: 'StartsUsing',
      netRegex: { id: '8A48', source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Be on red half',
          de: 'Geh zur roten Seite',
          fr: 'Placez-vous sur la moitié rouge',
          ja: '赤い安置',
          cn: '站红色半场',
          ko: '빨간쪽이 안전',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Torrential Tridents',
      type: 'StartsUsing',
      netRegex: { id: '8A4E', source: 'Eulogia', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Last trident => 1st trident',
          de: 'Letzer Dreizack => erster Dreizack',
          fr: 'Dernier trident -> 1er trident',
          ja: '最後の槍 => 1番目の槍へ',
          ko: '마지막 창 🔜 첫번째 창으로',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Destructive Bolt',
      type: 'StartsUsing',
      netRegex: { id: '8CFD', source: 'Eulogia' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Thaleia Eulogia Byregot\'s Strike',
      type: 'StartsUsing',
      netRegex: { id: '8A52', source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback (with lightning)',
          de: 'Rückstoß (mit Blitzen)',
          fr: 'Poussée (avec éclair)',
          ja: 'ノックバック (雷)',
          cn: '击退 (带闪电)',
          ko: '넉백 (번개 조심)',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Thousandfold Thrust',
      type: 'HeadMarker',
      netRegex: { id: ['0182', '0183', '0184', '0185'], target: 'Eulogia' },
      alertText: (_data, matches, output) => {
        return {
          '0182': output.back(),
          '0183': output.front(),
          '0184': output.left(),
          '0185': output.right(),
        }[matches.id];
      },
      outputStrings: {
        front: Outputs.front,
        back: Outputs.back,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'Thaleia Eulogia As Above So Below',
      type: 'StartsUsing',
      netRegex: { id: ['8A5B', '8A5C'], source: 'Eulogia' },
      infoText: (_data, matches, output) => {
        if (matches.id === '8A5B')
          return output.red();
        return output.blue();
      },
      outputStrings: {
        red: {
          en: 'Blue is safe',
          de: 'Blau ist sicher',
          fr: 'Bleu est sûr',
          ja: '青安置',
          ko: '파랑색이 안전',
        },
        blue: {
          en: 'Red is safe',
          de: 'Rot ist sicher',
          fr: 'Rouge est sûr',
          ja: '赤安置',
          ko: '빨강색이 안전',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Climbing Shot',
      type: 'StartsUsing',
      netRegex: { id: '8D0B', source: 'Eulogia', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Thaleia Eulogia Soaring Minuet',
      type: 'StartsUsing',
      netRegex: { id: '8A69', source: 'Eulogia', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Thaleia Eulogia Eudaimon Eorzea',
      type: 'StartsUsing',
      netRegex: { id: '8A2C', source: 'Eulogia', capture: false },
      durationSeconds: 18,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'AoE',
          ja: '連続全体攻撃',
          ko: '지속적으로 전체 공격!',
        },
      },
    },
    // ---------------------------------------------------------------------
    {
      id: 'Thaleia 어듬이 Llymlaen Denizens of the Deep',
      type: 'StartsUsing',
      netRegex: { id: '8820', source: 'Llymlaen', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Serpents come out!',
          ko: '뱀 나와요!',
        },
      },
    },
    {
      id: 'Thaleia 어듬이 Oschon Arrow Trail',
      type: 'StartsUsing',
      netRegex: { id: '89B2', source: 'Oschon', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Avoid puddles!',
          ko: '연속 세로 장판, 피해요!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Left Bank/Right Bank': 'Left/Right Bank',
        'Right Bank/Left Bank': 'Right/Left Bank',
        'Left Strait/Right Strait': 'Left/Right Strait',
        'Blueblossoms/Giltblossoms': 'Blue/Giltblossoms',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Eulogia': 'Eulogia',
        'Llymlaen(?!\')': 'Llymlaen',
        'Oschon(?!\')': 'Oschon',
        'Thaliak(?!\')': 'Thaliak',
        'The Briny Deep': 'Auge des Meeres',
        'The River Of Knowledge': 'Fluss der Weisheit',
        'The Stairway To The Seventh': 'Aufgang zum Firmament',
        'The Twelve\'s Embrace': 'Himmlische Sphäre des Segens',
        'The Way of the Wise': 'Kanal des Wissens',
        'The Windward Pass': 'Pfad des Windes',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Eulogia': 'Eulogie',
        'Llymlaen(?!\')': 'Llymlaen',
        'Oschon(?!\')': 'Oschon',
        'Thaliak(?!\')': 'Thaliak',
        'The Briny Deep': 'Œil de l\'océan',
        'The River Of Knowledge': 'Rivière du savoir',
        'The Stairway To The Seventh': 'Marches du firmament',
        'The Twelve\'s Embrace': 'Sphère céleste de la bénédiction',
        'The Way of the Wise': 'Canaux de la connaissance',
        'The Windward Pass': 'Voie des vents',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Eulogia': 'エウロギア',
        'Llymlaen(?!\')': 'リムレーン',
        'Oschon(?!\')': 'オシュオン',
        'Thaliak(?!\')': 'サリャク',
        'The Briny Deep': '大洋の虚',
        'The River Of Knowledge': '知恵の河',
        'The Stairway To The Seventh': '六天座の階',
        'The Twelve\'s Embrace': '祝福の天球',
        'The Way of the Wise': '導きの水廊',
        'The Windward Pass': '風の通り道',
      },
      'replaceText': {
        '\\(cast\\)': '(詠唱)',
        'Altitude': 'アルティチュード',
        'Arrow Trail': 'アロートレイル',
        'As Above, So Below': '死生択一の炎',
        'Blueblossoms/Giltblossoms': '青・黄花散',
        'Byregot\'s Strike': 'ビエルゴズ・ストライク',
        'Climbing Shot': 'クライムシュート',
        'Crash': '衝突',
        'Dawn of Time': '星天極光',
        'Deep Dive': '海淵落とし',
        'Denizens of the Deep': '海蛇招来',
        'Destructive Bolt': '壊雷撃',
        'Dire Straits': '両舷掃討',
        'Downhill': 'ダウンヒル',
        'Eudaimon Eorzea': 'エウダイモン・エオルゼア',
        'Everfire': '死の襲火',
        'First Blush': '月閃',
        'First Form': '壱の構え',
        'Flinted Foehn': 'フェーンアロー',
        'Frothing Sea': '大洋の白波',
        'Full Bright': '月夜の巡り',
        'Godsbane': 'ゴッズベーン',
        'Great Whirlwind': '大旋風',
        'Hand of the Destroyer': '壊神創幻撃',
        'Hieroglyphika': 'ヒエログリュフィカ',
        'Hydroptosis': 'ヒュドルピトシス',
        'Hydrostasis': 'ヒュドルスタシス',
        'Katarraktes': 'カタラクティス',
        'Landing': '落着',
        'Left Bank/Right Bank': '左・右岸氾濫',
        'Left Strait/Right Strait': '左・右舷掃討',
        'Lightning Bolt': '落雷',
        'Lofty Peaks': '風天の霊峰',
        'Love\'s Light': '慈愛の月',
        'Maelstrom': 'メイルシュトローム',
        'Matron\'s Breath': '豊穣の息吹',
        'Moving Mountains': '造山振動',
        'Navigator\'s Trident': 'リムレーンズトライデント',
        'Once Burned': '生の襲火',
        'Peak Peril': '造山乱流',
        'Petrine': '・ペトゥロス',
        'Piton Pull': 'ハーケンブリング',
        'Quintessence': 'クイーン・アームパンチ',
        'Radiant Finish': '焔扇流舞・終炎',
        'Radiant Flight': '焔扇',
        'Radiant Flourish': '焔扇火',
        'Radiant Rhythm': '焔扇流舞',
        'Reproduce': '分体生成',
        'Rheognosis': 'レーオノシス',
        'Rhyton': 'リュトン',
        'Right Bank/Left Bank': '右・左岸氾濫',
        'Seafoam Spiral': '輪の波浪',
        'Second Form': '弐の構え',
        'Serpents\' Tide': '海蛇の進撃',
        'Shockwave': '衝撃波',
        'Soaring Minuet': 'メヌエットアロー',
        'Solar Fans': '紅炎扇刃',
        'Stormwhorl': '時化の渦風',
        'Stormwinds': '時化の潮風',
        'Stormy Seas': '大時化起こし',
        'Sudden Downpour': 'ダウンポール',
        'Sunbeam': '太陽光',
        'Surging Wave': '波穿ち',
        'Swinging Draw': 'スイングアロー',
        'Tempest': '大海嵐',
        'Tetraktuos Kosmos': 'テトラクテュス・コスモス',
        'Tetraktys': 'テトラクテュス',
        'The Builder\'s Art': 'ビエルゴの神力',
        'The Destroyer\'s Might': 'ラールガーの神力',
        'The Fury\'s Ambition': 'ハルオーネの神力',
        'The Keeper\'s Gravity': 'アルジクの神力',
        'The Lover\'s Devotion': 'メネフィナの神力',
        'The Matron\'s Plenty': 'ノフィカの神力',
        'The Navigator\'s Command': 'リムレーンの神力',
        'The Scholar\'s Wisdom': 'サリャクの神力',
        'The Spinner\'s Cunning': 'ニメーヤの神力',
        'The Traders\' Equity': 'ナルザルの神力',
        'The Wanderer\'s Whimsy': 'オシュオンの神力',
        'The Warden\'s Radiance': 'アーゼマの神力',
        'Third Form': '参の構え',
        'Thlipsis': 'スリプシス',
        'Thousandfold Thrust': 'サウザンスラスト',
        'Time and Tide': '時間操作',
        'To the Last': '',
        'Torrential Tridents': '銛の雨',
        'Trek Shot': 'トレックアロー',
        'Wandering Shot': 'ワンダリングショット',
        'Wandering Volley': 'ワンダリングバラージ',
        'Wind Rose': '円の旋風',
        'the Arrow': 'オシュオンの矢',
        'the Whorl': '創世の神渦',
      },
    },
  ],
});
