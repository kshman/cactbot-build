const phases = {
  A8B5: 'add',
  A8B9: '1st',
  AA14: '2nd',
  AA15: '3rd',
  AA16: '4th',
  AA17: '5th',
  AA18: '6th', // Roseblood: 6th Bloom
};
const fallOutputs = {
  mesg: {
    en: '${ind} (${res})',
    ja: '${ind} (${res})',
    ko: '${ind} ${res}',
  },
  stack: Outputs.stackMarker,
  inside: Outputs.in,
  outside: Outputs.out,
  stay: {
    en: 'Stay',
    ja: 'そのまま',
    ko: '그대로',
  },
  in: {
    en: 'In',
    ja: '内',
    ko: '🡹',
  },
  out: {
    en: 'Out',
    ja: '外',
    ko: '🡻',
  },
  split: {
    en: '/',
    ja: '/',
    ko: '',
  },
};
// RECOLLECTION (EXTREME)
Options.Triggers.push({
  id: 'RecollectionExtreme',
  zoneId: ZoneId.RecollectionExtreme,
  timelineFile: 'zelenia-ex.txt',
  initData: () => {
    return {
      phase: 'door',
      falls: [],
      fallRes: [],
    };
  },
  triggers: [
    {
      id: 'ZeleniaEx Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Zelenia' },
      suppressSeconds: 1,
      run: (data, matches) => data.phase = phases[matches.id] ?? 'unknown',
    },
    {
      id: 'ZeleniaEx Thorned Catharsis',
      type: 'StartsUsing',
      netRegex: { id: 'A89E', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'ZeleniaEx Shock',
      type: 'StartsUsing',
      netRegex: { id: 'A8A1', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      response: Responses.protean(),
    },
    {
      id: 'ZeleniaEx My Shock',
      type: 'HeadMarker',
      netRegex: { id: ['0244', '0245'] },
      condition: (data, matches) => data.phase === 'door' && data.me === matches.target,
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '0244')
          return output.donut();
        return output.circle();
      },
      outputStrings: {
        donut: {
          en: 'Get tower',
          ja: '塔踏み',
          ko: '도넛, 타워로',
        },
        circle: {
          en: 'Spread',
          ja: '散会',
          ko: '동글이, 흩어져요',
        },
      },
    },
    {
      id: 'ZeleniaEx Specter of the Lost',
      type: 'StartsUsing',
      netRegex: { id: 'A89F', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      response: Responses.tetherBuster(),
    },
    {
      id: 'ZeleniaEx Escelons\' Fall',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      preRun: (data, matches) => data.falls.push(matches.count === '2F6' ? 'near' : 'far'),
      durationSeconds: 7.5,
      suppressSeconds: (data) => data.falls.length > 1 ? 20 : 0,
      infoText: (data, _matches, output) => {
        const [bait1, bait2] = data.falls;
        if (bait1 === undefined || bait2 === undefined)
          return;
        data.falls = [];
        data.fallRes = [];
        let move;
        if (data.phase !== 'shade')
          move = Autumn.isDps(data.moks) ? 'out' : 'in';
        else {
          move = data.donut === data.role
            ? (bait1 === 'near' ? 'out' : 'in')
            : (bait1 === 'near' ? 'in' : 'out');
        }
        const move1 = move;
        const move2 = move1 === 'in' ? 'out' : 'in';
        if (bait1 === bait2) {
          data.fallRes.push(move1);
          data.fallRes.push(move2);
          data.fallRes.push(move2);
          data.fallRes.push(move1);
        } else {
          data.fallRes.push(move1);
          data.fallRes.push(move1);
          data.fallRes.push(move2);
          data.fallRes.push(move2);
        }
        const join = data.fallRes.map((v) => output[v]()).join(output.split());
        data.fallPrev = data.fallRes.shift();
        if (data.phase === 'shade' && data.donut === data.role) {
          data.fallPrev = undefined;
          return output.mesg({ ind: output.stack(), res: join });
        }
        const ind = move1 === 'in' ? output.inside() : output.outside();
        return output.mesg({ ind: ind, res: join });
      },
      outputStrings: {
        ...fallOutputs,
      },
    },
    {
      id: 'ZeleniaEx Escelons\' Fall Next',
      type: 'Ability',
      netRegex: { id: ['A8AD', 'A8AE'], source: 'Zelenia', capture: false },
      condition: (data) => data.fallRes.length > 0,
      durationSeconds: 2.5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...fallOutputs,
        };
        const join = data.fallRes.map((v) => output[v]()).join(output.split());
        const move = data.fallRes.shift();
        if (move === undefined)
          return;
        const prev = data.fallPrev;
        data.fallPrev = move;
        if (prev === move)
          return { infoText: output.mesg({ ind: output.stay(), res: join }) };
        const ind = move === 'in' ? output.inside() : output.outside();
        return { alertText: output.mesg({ ind: ind, res: join }) };
      },
    },
    {
      id: 'ZeleniaEx Stock Break',
      type: 'StartsUsing',
      netRegex: { id: 'A8D5', source: 'Zelenia', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.fiveAOE(),
      outputStrings: {
        fiveAOE: {
          en: '5x AoEs',
          ko: '5x 전체공격',
        },
      },
    },
    {
      id: 'ZeleniaEx Tether',
      type: 'Tether',
      netRegex: { id: '0011' },
      condition: (data, matches) => data.me === matches.target,
      durationSeconds: 3,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Tether',
          ja: '線',
          ko: '내게 줄!',
        },
      },
    },
    {
      id: 'ZeleniaEx Perfumed Quietus',
      type: 'StartsUsing',
      netRegex: { id: 'A8CD', source: 'Zelenia', capture: false },
      delaySeconds: 4,
      response: Responses.bigAoe(),
    },
    {
      id: 'ZeleniaEx 1st Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['00A7', '00A8'], capture: true },
      infoText: (_data, matches, output) => {
        if (matches.id === '00A7')
          return output.text({ dir: output.east(), rot: output.cw() });
        return output.text({ dir: output.north(), rot: output.ccw() });
      },
      outputStrings: {
        text: {
          en: '${dir} ${rot}',
          ja: '${dir} ${rot}',
          ko: '${dir} ${rot}',
        },
        cw: Outputs.clockwise,
        ccw: Outputs.counterclockwise,
        north: Outputs.north,
        east: Outputs.east,
      },
    },
    {
      id: 'ZeleniaEx A.Thunder III',
      type: 'StartsUsing',
      netRegex: { id: 'A8E3', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      response: Responses.spread('alert'),
    },
    {
      id: 'ZeleniaEx A.Thunder IV',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia' },
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (data.phase === '2nd')
          return matches.id === 'A9BA' ? output.out2nd() : output.in2nd();
        if (data.phase === '5th')
          return matches.id === 'A9BA' ? output.out5th() : output.in5th();
      },
      outputStrings: {
        in2nd: {
          en: 'In first',
          ja: '内から',
          ko: '한칸 안쪽으로',
        },
        out2nd: {
          en: 'Out first',
          ja: '外から',
          ko: '두칸 바깥쪽으로',
        },
        in5th: {
          en: 'In',
          ja: '内から',
          ko: '안으로',
        },
        out5th: {
          en: 'Out',
          ja: '外から',
          ko: '바깥으로',
        },
      },
    },
    {
      id: 'ZeleniaEx A.Thunder IV Next',
      type: 'Ability',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia' },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (data.phase === '2nd')
          return matches.id === 'A9BA' ? output.in2nd() : output.out2nd();
        if (data.phase === '5th')
          return matches.id === 'A9BA' ? output.in5th() : output.out5th();
      },
      outputStrings: {
        in2nd: {
          en: 'In second',
          ja: '内へ',
          ko: '안으로 🔜 피해요',
        },
        out2nd: {
          en: 'Out second',
          ja: '外へ',
          ko: '바깥으로 🔜 피해요',
        },
        in5th: {
          en: 'In',
          ja: '内へ',
          ko: '🡼방향 안으로',
        },
        out5th: {
          en: 'Out',
          ja: '外へ',
          ko: '🡼방향 바깥으로',
        },
      },
    },
    {
      id: 'ZeleniaEx Rose',
      type: 'HeadMarker',
      netRegex: { id: '0250' },
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        const tdps = data.party.isDPS(matches.target);
        const idps = Autumn.isDps(data.moks);
        const rose = tdps === idps;
        if (data.phase === '3rd')
          return rose ? output.hold() : output.tower();
        if (data.phase === '4th')
          return rose ? output.hold() : output.spread();
        if (data.phase === '6th')
          return rose ? output.zigzag() : output.tower();
      },
      outputStrings: {
        hold: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 그대로',
        },
        zigzag: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 타워와 지그재그',
        },
        tower: {
          en: 'Get towers',
          ja: '塔踏み',
          ko: '타워 밟아요',
        },
        spread: {
          en: 'Spread',
          ja: '散会',
          ko: '북쪽에서 흩어져요',
        },
      },
    },
    {
      id: 'ZeleniaEx Shade\'s Shock',
      type: 'StartsUsing',
      netRegex: { id: 'A8A1', source: 'Zelenia\'s Shade', capture: false },
      durationSeconds: 5,
      infoText: (data, _matches, output) => Autumn.isDps(data.moks) ? output.dps() : output.sup(),
      run: (data) => data.phase = 'shade',
      outputStrings: {
        sup: {
          en: 'Stack north',
          ja: '北に集合',
          ko: 'TH 북쪽에서 모여요',
        },
        dps: {
          en: 'Stack south',
          ja: '南に集合',
          ko: 'DPS 남쪽에서 모여요',
        },
      },
    },
    {
      id: 'ZeleniaEx Shade\'s Shock Determine Donut',
      type: 'HeadMarker',
      netRegex: { id: '0244' },
      condition: (data) => data.phase === 'shade',
      suppressSeconds: 1,
      run: (data, matches) => {
        if (data.party.isDPS(matches.target))
          data.donut = 'dps';
        else if (Autumn.isDps(data.moks))
          data.donut = 'unknown';
        else
          data.donut = data.role;
      },
    },
    {
      id: 'ZeleniaEx Encircling Thorns',
      type: 'StartsUsing',
      netRegex: { id: 'A8C3', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack south',
          ja: '南に集合',
          ko: '남쪽에서 모여요 (덩쿨)',
        },
      },
    },
    {
      id: 'ZeleniaEx A.Banish III',
      type: 'StartsUsing',
      netRegex: { id: 'A8E8', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Break tethers',
          ja: '線切る',
          ko: '덩쿨 끊어요!',
        },
      },
    },
    {
      id: 'ZeleniaEx Power Break',
      type: 'StartsUsing',
      netRegex: { id: ['A8B0', 'A8B1'], source: 'Zelenia\'s Shade' },
      delaySeconds: 2,
      durationSeconds: 3,
      infoText: (_data, matches, output) => {
        let left = matches.id === 'A8B0';
        if (parseFloat(matches.y) < 100)
          left = !left;
        return left ? output.left() : output.right();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'ZeleniaEx 5th Chakram',
      type: 'ActorSetPos',
      netRegex: { id: '40[0-9A-F]{6}', capture: true },
      condition: (data, matches) => {
        if (data.phase !== '5th')
          return false;
        if (Math.abs(100 - parseFloat(matches.x)) < 2)
          return false;
        if (Math.abs(100 - parseFloat(matches.y)) < 2)
          return false;
        return true;
      },
      suppressSeconds: 9999,
      infoText: (_data, matches, output) => {
        const w = parseFloat(matches.x) < 100;
        const n = parseFloat(matches.y) < 100;
        const dir = n
          ? (w ? output.se() : output.sw())
          : (w ? output.nw() : output.ne());
        return output.text({ dir: dir });
      },
      outputStrings: {
        text: {
          en: 'Start ${dir}',
          ja: '${dir}へ',
          ko: '${dir}으로',
        },
        ne: Outputs.northeast,
        se: Outputs.southeast,
        sw: Outputs.southwest,
        nw: Outputs.northwest,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Briar Thorn': 'Atomisator',
        'Zelenia(?!\')': 'Zelenia',
        'Zelenia\'s Shade': 'Phantom-Zelenia',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(chakrams\\)': '(Chakrams)',
        '\\(enrage\\?\\)': '(Finalangriff?)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(markers\\)': '(Marker)',
        '\\(resolves\\)': '(Auflösen)',
        '\\(snapshot\\)': '(Snapshot)',
        'Alexandrian Banish II(?!I)': 'Ritterliches Verbannra',
        'Alexandrian Banish III': 'Ritterliches Verbannga',
        'Alexandrian Holy': 'Ritterliches Sanctus',
        'Alexandrian Thunder II(?!I)': 'Ritterliches Blitzra',
        'Alexandrian Thunder III': 'Ritterliches Blitzga',
        'Alexandrian Thunder IV': 'Ritterliches Blitzka',
        'Blessed Barricade': 'Heilige Mauer',
        'Bud of Valor': 'Lug und Trug',
        'Emblazon': 'Mahnendes Siegel',
        'Encircling Thorns': 'Rosendorn',
        'Escelons\' Fall': 'Aufsteigendes Kreuz',
        'Explosion': 'Explosion',
        'Holy Hazard': 'Heilige Gefahr',
        'Perfumed Quietus': 'Quietus-Rose',
        'Power Break': 'Schockbolzen',
        'Queen\'s Crusade': 'Heiliges Schlachtfeld',
        'Rose Red': 'Rosenfinale',
        'Roseblood Bloom': 'Arkane Enthüllung',
        'Roseblood Withering': 'Arkane Enthüllung: Nullform',
        'Roseblood: 2nd Bloom': 'Arkane Enthüllung: Zweite Form',
        'Roseblood: 3rd Bloom': 'Arkane Enthüllung: Dritte Form',
        'Roseblood: 4th Bloom': 'Arkane Enthüllung: Vierte Form',
        'Roseblood: 5th Bloom': 'Arkane Enthüllung: Fünfte Form',
        'Roseblood: 6th Bloom': 'Arkane Enthüllung: Sechste Form',
        'Shock': 'Schock',
        'Spearpoint Push': 'Sturzflug',
        'Specter of the Lost': 'Spektralschlag',
        'Stock Break': 'Exekutionsschlag',
        'Thorned Catharsis': 'Rosenkatharsis',
        'Thunder Slash': 'Donnerhieb',
        'Valorous Ascension': 'Atomisator',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Briar Thorn': 'Mortimer',
        'Zelenia(?!\')': 'Zelenia',
        'Zelenia\'s Shade': 'double de Zelenia',
      },
      'replaceText': {
        'Alexandrian Banish II(?!I)': 'Extra Bannissement chevaleresque',
        'Alexandrian Banish III': 'Méga Bannissement chevaleresque',
        'Alexandrian Holy': 'Miracle chevaleresque',
        'Alexandrian Thunder II(?!I)': 'Méga Foudre chevaleresque',
        'Alexandrian Thunder III': 'Méga Foudre chevaleresque',
        'Alexandrian Thunder IV': 'Giga Foudre chevaleresque',
        'Blessed Barricade': 'Mur sacré',
        'Bud of Valor': 'Dupligenèse',
        'Emblazon': 'Cercle d\'exhortation',
        'Encircling Thorns': 'Épine de rose',
        'Escelons\' Fall': 'Péril cruciforme',
        'Explosion': 'Explosion',
        'Holy Hazard': 'Péril miraculeux',
        'Perfumed Quietus': 'Quietus de la rose',
        'Power Break': 'Fente puissante',
        'Queen\'s Crusade': 'Domaine sacré',
        'Rose Red': 'Rose finale',
        'Roseblood Bloom': 'Déploiement arcanique',
        'Roseblood Withering': 'Déploiement arcanique : annihilation',
        'Roseblood: 2nd Bloom': 'Déploiement arcanique : seconde forme',
        'Roseblood: 3rd Bloom': 'Déploiement arcanique : troisième forme',
        'Roseblood: 4th Bloom': 'Déploiement arcanique : quatrième forme',
        'Roseblood: 5th Bloom': 'Déploiement arcanique : cinquième forme',
        'Roseblood: 6th Bloom': 'Déploiement arcanique : sixième forme',
        'Shock': 'Choc',
        'Spearpoint Push': 'Ruée fulgurante',
        'Specter of the Lost': 'Fente spectrale',
        'Stock Break': 'Fente',
        'Thorned Catharsis': 'Roses cathartiques',
        'Thunder Slash': 'Foudrolle',
        'Valorous Ascension': 'Mortimer',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Briar Thorn': 'クライムハザード',
        'Zelenia(?!\')': 'ゼレニア',
        'Zelenia\'s Shade': 'ゼレニアの幻影',
      },
      'replaceText': {
        'Alexandrian Banish II(?!I)': 'キングダム・バニシュラ',
        'Alexandrian Banish III': 'キングダム・バニシュガ',
        'Alexandrian Holy': 'キングダム・ホーリー',
        'Alexandrian Thunder II(?!I)': 'キングダム・サンダラ',
        'Alexandrian Thunder III': 'キングダム・サンダガ',
        'Alexandrian Thunder IV': 'キングダム・サンダジャ',
        'Blessed Barricade': '聖護壁',
        'Bud of Valor': '幻影生成',
        'Emblazon': '活性紋',
        'Encircling Thorns': 'ローズソーン',
        'Escelons\' Fall': 'クライムクロス',
        'Explosion': '爆発',
        'Holy Hazard': 'ホーリーハザード',
        'Perfumed Quietus': 'クワイタスローズ',
        'Power Break': 'パワーブレイク',
        'Queen\'s Crusade': '聖戦領域',
        'Rose Red': 'ローズ・オブ・フィナーレ',
        'Roseblood Bloom': '魔法陣展開',
        'Roseblood Withering': '魔法陣展開・零式',
        'Roseblood: 2nd Bloom': '魔法陣展開・二式',
        'Roseblood: 3rd Bloom': '魔法陣展開・三式',
        'Roseblood: 4th Bloom': '魔法陣展開・四式',
        'Roseblood: 5th Bloom': '魔法陣展開・五式',
        'Roseblood: 6th Bloom': '魔法陣展開・六式',
        'Shock': 'ショック',
        'Spearpoint Push': '突撃',
        'Specter of the Lost': 'スペクトルブレイク',
        'Stock Break': 'ストックブレイク',
        'Thorned Catharsis': 'ローズ・カタルシス',
        'Thunder Slash': '雷鳴剣',
        'Valorous Ascension': 'クライムハザード',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Briar Thorn': '凌空破',
        'Zelenia(?!\')': '泽莲尼娅',
        'Zelenia\'s Shade': '泽莲尼娅的幻影',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(chakrams\\)': '(预兆)',
        '\\(enrage\\?\\)': '(狂暴?)',
        '\\(enrage\\)': '(狂暴)',
        '\\(markers\\)': '(标记)',
        '\\(resolves\\)': '(判定)',
        '\\(snapshot\\)': '(快照)',
        'Alexandrian Banish II(?!I)': '王国中放逐',
        'Alexandrian Banish III': '王国强放逐',
        'Alexandrian Holy': '王国神圣',
        'Alexandrian Thunder II(?!I)': '王国震雷',
        'Alexandrian Thunder III': '王国暴雷',
        'Alexandrian Thunder IV': '王国霹雷',
        'Blessed Barricade': '圣护壁',
        'Bud of Valor': '幻影生成',
        'Emblazon': '活性纹',
        'Encircling Thorns': '玫瑰荆棘',
        'Escelons\' Fall': '凌空错',
        'Explosion': '爆炸',
        'Holy Hazard': '神圣破',
        'Perfumed Quietus': '寂灭之玫瑰',
        'Power Break': '破势之剑',
        'Queen\'s Crusade': '圣战领域',
        'Rose Red': '终曲之玫瑰',
        'Roseblood Bloom': '魔法阵展开',
        'Roseblood Withering': '魔法阵展开·零式',
        'Roseblood: 2nd Bloom': '魔法阵展开·二式',
        'Roseblood: 3rd Bloom': '魔法阵展开·三式',
        'Roseblood: 4th Bloom': '魔法阵展开·四式',
        'Roseblood: 5th Bloom': '魔法阵展开·五式',
        'Roseblood: 6th Bloom': '魔法阵展开·六式',
        'Shock': '震惊',
        'Spearpoint Push': '突击',
        'Specter of the Lost': '破灵之剑',
        'Stock Break': '破防之剑',
        'Thorned Catharsis': '玫瑰涤',
        'Thunder Slash': '雷鸣剑',
        'Valorous Ascension': '凌空破',
      },
    },
  ],
});
