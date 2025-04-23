// CE explainer: https://www.youtube.com/watch?v=L4lXAV_OD-0
// TODO: snake: everything
// TODO: blade: everything
// TODO: lyon: everything
// TODO: blood: Flight of the Malefic cleaves
// TODO: blood: gaze vs line attack from adds
// TODO: wolf: 6x Imaginifers cast thermal gust hitting east/west (only seen east at -828...-808)
// TODO: cavalry: early call for knockback direction?
// TODO: calalry: is Ride Down explainable??
// TODO: time: is it possible to find where slow clocks are?
// TODO: machines: can describe initial safe quadrant from first charges?
// TODO: machines: can describe "diagonal line bomb" safe spot
// TODO: machines: can determine rotating corner to go to
// TODO: alkonost: foreshadowing (both in CE and Dalraida)
// TODO: alkonost: :Tamed Alkonost:5F26:Stormcall: can be knockback to/away fast/slow orbs
// TODO: hallway: left/right lasers (check getCombatants???)
// TODO: saunion: are the mobile halo / crossray abilities corresponding to directions?
// TODO: diablo: diabolic gate directional callouts???
// TODO: diablo: improve timing on acceleration bomb
// List of events:
// https://github.com/xivapi/ffxiv-datamining/blob/master/csv/DynamicEvent.csv
//
// These ids are (unfortunately) gathered by hand and don't seem to correlate
// to any particular bits of data.  However, there's a game log message when you
// register for a CE and an 0x21 message with this id when you accept and
// teleport in.  This avoids having to translate all of these names and also
// guarantees that the player is actually in the CE for the purpose of
// filtering triggers.
const ceIds = {
  // On Serpents' Wings
  serpents: '211',
  // Feeling the Burn
  feeling: '20E',
  // The Broken Blade
  blade: '21F',
  // From Beyond the Grave
  grave: '21B',
  // With Diremite and Main
  diremite: '221',
  // Here Comes the Cavalry
  cavalry: '21C',
  // Head of the Snake
  snake: '21E',
  // There Would Be Blood
  blood: '210',
  // Never Cry Wolf
  wolf: '20F',
  // Time To Burn
  time: '21D',
  // Lean, Mean, Magitek Machines
  machines: '218',
  // Worn to a Shadow
  shadow: '222',
  // A Familiar Face
  face: '212',
  // Looks to Die For
  looks: '207',
  // Taking the Lyon's Share
  lyon: '220',
  // The Dalriada
  dalriada: '213',
  dalriadaCuchulainn: '214',
  dalriadaHallway: '215',
  dalriadaSaunion: '216',
  dalriadaDiablo: '217',
};
const limitCutHeadmarkers = ['004F', '0050', '0051', '0052'];
// TODO: promote something like this to Conditions?
const tankBusterOnParty = (ceName) => (data, matches) => {
  if (ceName !== undefined && data.ce !== ceName)
    return false;
  if (matches.target === data.me)
    return true;
  if (data.role !== 'healer')
    return false;
  return data.party.inParty(matches.target);
};
Options.Triggers.push({
  id: 'Zadnor',
  zoneId: ZoneId.Zadnor,
  comments: {
    en: 'Dalriada triggers/timeline.  Some Critical Engagements.',
    de: 'Dalriada Trigger/Timeline.  Einige Kritische Gefechte vorhanden.',
    cn: '旗舰达尔里阿达号攻略战触发器/时间轴。部分CE (紧急遭遇战)。',
  },
  timelineFile: 'zadnor.txt',
  resetWhenOutOfCombat: false,
  triggers: [
    {
      id: 'Zadnor Critical Engagement',
      type: 'ActorControl',
      netRegex: { command: '80000014' },
      run: (data, matches) => {
        // This fires when you win, lose, or teleport out.
        if (matches.data0 === '00') {
          if (data.ce !== undefined && data.options.Debug)
            console.log(`Stop CE: ${data.ce}`);
          // Stop any active timelines.
          data.StopCombat();
          // Prevent further triggers for any active CEs from firing.
          delete data.ce;
          return;
        }
        delete data.ce;
        const ceId = matches.data0.toUpperCase();
        const anonCEs = ceIds;
        for (const key in anonCEs) {
          if (anonCEs[key] === ceId) {
            if (data.options.Debug)
              console.log(`Start CE: ${key} (${ceId})`);
            data.ce = key;
            return;
          }
        }
        if (data.options.Debug)
          console.log(`Start CE: ??? (${ceId})`);
      },
    },
    // ***** On Serpents' Wings *****
    {
      id: 'Zadnor Serpents Turbine',
      type: 'StartsUsing',
      netRegex: { source: 'Stormborne Zirnitra', id: '5E54' },
      condition: (data) => data.ce === 'serpents',
      preRun: (data) => data.serpentsTurbineCount = (data.serpentsTurbineCount ?? 0) + 1,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      alertText: (data, _matches, output) => {
        // TODO: how does this loop?
        if (data.serpentsTurbineCount === 1)
          return output.knockbackDonut();
        else if (data.serpentsTurbineCount === 2)
          return output.knockbackIntoCircle();
        else if (data.serpentsTurbineCount === 3)
          return output.knockbackExplosion();
        else if (data.serpentsTurbineCount === 4)
          return output.knockbackDonut();
        else if (data.serpentsTurbineCount === 5)
          return output.knockbackIntoSafe();
      },
      outputStrings: {
        knockbackDonut: {
          en: 'Knockback + Stack Donuts Middle',
          de: 'Rückstoß + Donuts mittig sammeln',
          fr: 'Poussée + Packez les donuts au milieu',
          cn: '击退 + 月环集合击退',
          ko: '넉백 + 도넛장판 피해요',
        },
        knockbackIntoCircle: {
          en: 'Knockback (towards first circles)',
          de: 'Rückstoß (zu den ersten Kreisen)',
          fr: 'Poussée (vers les premiers cercles)',
          cn: '向第一个圈圈击退',
          ko: '먼저 뜬 장판으로 넉백',
        },
        knockbackIntoSafe: {
          en: 'Knockback (towards open spots)',
          de: 'Rückstoß (zum offenen Bereich)',
          fr: 'Poussée (vers des endroits ouverts)',
          cn: '向空缺位置击退',
          ko: '안전한 곳으로 넉백',
        },
        knockbackExplosion: {
          // Can't trust people to make a safe spot,
          // so using knockback prevention is probably the best advice.
          en: 'Knockback (prevent)',
          de: 'Rückstoß (verhindern)',
          fr: 'Poussée (empêchez-là)',
          cn: '防击退',
          ko: '넉백 (저항하는게 좋아요)',
        },
      },
    },
    // ***** Feeling the Burn *****
    {
      id: 'Zadnor Feeling Suppressive Magitek Rays',
      type: 'StartsUsing',
      netRegex: { source: 'Blackburn', id: '5C40', capture: false },
      condition: (data) => data.ce === 'feeling',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Feeling Chain Cannon You',
      type: 'HeadMarker',
      netRegex: { id: '00A4' },
      condition: (data, matches) => data.ce === 'feeling' && data.me === matches.target,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Chain Cannon on YOU',
          de: 'Kettenkanone auf DIR',
          fr: 'Canon en chaine sur VOUS',
          cn: '直线点名',
          ko: '내게 체인 캐논',
        },
      },
    },
    {
      id: 'Zadnor Feeling Chain Cannon Not You',
      type: 'HeadMarker',
      netRegex: { id: '00A4', capture: false },
      condition: (data) => data.ce === 'feeling',
      delaySeconds: 3,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stay Out of Lasers',
          de: 'Aus den Lasern gehen',
          fr: 'Restez à l\'écart des lasers',
          cn: '避开直线点名',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'Zadnor Feeling Analysis',
      type: 'StartsUsing',
      netRegex: { source: 'Blackburn', id: '5C37', capture: false },
      condition: (data) => data.ce === 'feeling',
      run: (data) => data.feelingAnalysis = true,
    },
    {
      id: 'Zadnor Feeling Read Orders Coordinated Assault',
      type: 'StartsUsing',
      netRegex: { source: 'Blackburn', id: '5C34', capture: false },
      condition: (data) => data.ce === 'feeling',
      alertText: (data, _matches, output) => {
        return data.feelingAnalysis ? output.point() : output.dodge();
      },
      run: (data) => delete data.feelingAnalysis,
      outputStrings: {
        dodge: {
          en: 'Dodge 4 Charges',
          de: 'Weiche 4 Anstürmen aus',
          fr: 'Esquivez les 4 charges',
          cn: '躲避4次冲锋',
          ko: '4연속 돌진 뒤돌아서 맞아요',
        },
        point: {
          en: 'Point at 4 Charges',
          de: 'Zeige auf dir 4 Anstürmen',
          fr: 'Pointez à 4 charges',
          cn: '瞄准4次冲锋',
          ko: '4연속 돌진 쳐다보며 맞아요',
        },
      },
    },
    // ***** The Broken Blade *****
    // ***** From Beyond the Grave *****
    {
      id: 'Zadnor Grave Soul Purge',
      type: 'StartsUsing',
      // 5E23 = get out first
      // 5E25 = get in first
      netRegex: { source: '4th-Make Shemhazai', id: ['5E23', '5E25'] },
      condition: (data) => data.ce === 'grave',
      suppressSeconds: 10,
      alertText: (_data, matches, output) => {
        return matches.id === '5E23' ? output.outThenIn() : output.inThenOut();
      },
      outputStrings: {
        outThenIn: Outputs.outThenIn,
        inThenOut: Outputs.inThenOut,
      },
    },
    {
      id: 'Zadnor Grave Soul Purge Second',
      type: 'StartsUsing',
      // 5E23 = get out first (so get in second)
      // 5E25 = get in first (so get out second)
      netRegex: { source: '4th-Make Shemhazai', id: ['5E23', '5E25'] },
      condition: (data) => data.ce === 'grave',
      delaySeconds: 5,
      suppressSeconds: 10,
      alertText: (_data, matches, output) => {
        return matches.id === '5E23' ? output.in() : output.out();
      },
      outputStrings: {
        out: Outputs.out,
        in: Outputs.in,
      },
    },
    {
      id: 'Zadnor Grave Devour Soul',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Shemhazai', id: '5E20' },
      condition: tankBusterOnParty('grave'),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Grave Blight',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Shemhazai', id: '5E1E', capture: false },
      condition: (data) => data.ce === 'grave',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Grave Crimson Blade',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '9934', capture: false },
      condition: (data) => data.ce === 'grave',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Behind Hernais',
          de: 'Geh hinter Hernais',
          fr: 'Passez derrière Hernais',
          cn: '去腐犬背后',
          ko: '에르네이스 뒤로',
        },
      },
    },
    {
      id: 'Zadnor Grave War Wraith',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '9933', capture: false },
      condition: (data) => data.ce === 'grave',
      // They hang out on the outside for a bit and then become targetable.
      delaySeconds: 11.5,
      suppressSeconds: 10,
      response: Responses.killAdds(),
    },
    {
      id: 'Zadnor Grave Aethertide',
      type: 'StartsUsing',
      netRegex: { source: 'Dyunbu The Accursed', id: '5E2A' },
      condition: (data, matches) => data.ce === 'grave' && data.me === matches.target,
      response: Responses.spread(),
    },
    {
      id: 'Zadnor Grave Forced March',
      type: 'GainsEffect',
      // 871 = Forward March
      // 872 = About Face
      // 873 = Left Face
      // 874 = Right Face
      netRegex: { source: '4th-Make Shemhazai', effectId: ['871', '872', '873', '874'] },
      condition: (data, matches) => data.ce === 'grave' && data.me === matches.target,
      alertText: (_data, matches, output) => {
        const effectId = matches.effectId.toUpperCase();
        if (effectId === '871')
          return output.forward();
        if (effectId === '872')
          return output.backward();
        if (effectId === '873')
          return output.left();
        if (effectId === '874')
          return output.right();
      },
      outputStrings: {
        forward: {
          en: 'March Forward Into Middle',
          de: 'Marchiere Vorwärts in die Mitte',
          fr: 'Marche en avant vers le milieu',
          cn: '强制移动: 前，去中间',
          ko: '강제이동: 앞 🔜 한가운데로',
        },
        backward: {
          en: 'March Backward Into Middle',
          de: 'Marchiere Rückwärts in die Mitte',
          fr: 'Marche en arrière vers le milieu',
          cn: '强制移动: 后，去中间',
          ko: '강제이동: 뒤 🔜 한가운데로',
        },
        left: {
          en: 'March Left Into Middle',
          de: 'Marchiere Links in die Mitte',
          fr: 'Marche à gauche vers le milieu',
          cn: '强制移动: 左，去中间',
          ko: '강제이동: 왼쪽 🔜 한가운데로',
        },
        right: {
          en: 'March Right Into Middle',
          de: 'Marchiere Rechts in die Mitte',
          fr: 'Marche à droite vers le milieu',
          cn: '强制移动: 右，去中间',
          ko: '강제이동: 오른쪽 🔜 한가운데로',
        },
      },
    },
    // ***** With Diremite and Main *****
    {
      id: 'Zadnor Diremite Crystal Needle',
      type: 'StartsUsing',
      netRegex: { source: 'Hedetet', id: '5E15' },
      condition: tankBusterOnParty('diremite'),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Diremite Shardstrike',
      type: 'StartsUsing',
      netRegex: { source: 'Hedetet', id: '5E17' },
      condition: (data, matches) => data.ce === 'diremite' && data.me === matches.target,
      response: Responses.spread(),
    },
    {
      id: 'Zadnor Diremite Hailfire You',
      type: 'HeadMarker',
      netRegex: { id: limitCutHeadmarkers },
      condition: (data, matches) => data.ce === 'diremite' && data.me === matches.target,
      preRun: (data, matches) => {
        data.diremiteHailfire ??= [];
        data.diremiteHailfire.push(matches.target);
      },
      alertText: (_data, matches, output) => {
        const id = matches.id;
        const num = limitCutHeadmarkers.indexOf(id) + 1;
        if (num < 1)
          return;
        const numStr = output[`num${num}`]();
        return output.text({ num: numStr });
      },
      outputStrings: {
        num1: Outputs.num1,
        num2: Outputs.num2,
        num3: Outputs.num3,
        num4: Outputs.num4,
        text: {
          en: '${num} (spread for laser)',
          de: '${num} (verteile für Laser)',
          fr: '${num} (dispersion pour le laser)',
          cn: '${num} (激光分散)',
          ko: '${num} (레이저 오니깐 흩어져요)',
        },
      },
    },
    {
      id: 'Zadnor Diremite Hailfire Not You',
      type: 'HeadMarker',
      netRegex: { id: limitCutHeadmarkers, capture: false },
      condition: (data) => data.ce === 'diremite',
      delaySeconds: 0.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.diremiteHailfire && !data.diremiteHailfire.includes(data.me))
          return output.text();
      },
      run: (data) => delete data.diremiteHailfire,
      outputStrings: {
        text: {
          en: 'Avoid Lasers',
          de: 'Laser ausweichen',
          fr: 'Évitez les lasers',
          ja: 'レーザーを避ける',
          cn: '躲避激光',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'Zadnor Diremite Crystaline Stingers',
      type: 'StartsUsing',
      netRegex: { source: 'Hedetet', id: '5E0D', capture: false },
      condition: (data) => data.ce === 'diremite',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hide Behind Silver Shard',
          de: 'Hinter Silber-Splitter verstecken',
          fr: 'Cachez-vous derrière l\'éclat argenté',
          cn: '躲在银色碎片后',
          ko: '흰색 기둥 뒤로',
        },
      },
    },
    {
      id: 'Zadnor Diremite Aetherial Stingers',
      type: 'StartsUsing',
      netRegex: { source: 'Hedetet', id: '5E0E', capture: false },
      condition: (data) => data.ce === 'diremite',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hide Behind Gold Shard',
          de: 'Hinter Gold-Splitter verstecken',
          fr: 'Cachez-vous derrière l\'éclat doré',
          cn: '躲在金色碎片后',
          ko: '노란 기둥 뒤로',
        },
      },
    },
    {
      id: 'Zadnor Diremite Sand Sphere',
      type: 'StartsUsing',
      netRegex: { source: 'Hedetet', id: '5E0F', capture: false },
      condition: (data) => data.ce === 'diremite',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away From Orbs',
          de: 'Weg von den Orbs',
          fr: 'Éloignez-vous des orbes',
          cn: '远离球球',
          ko: '구슬 피해요',
        },
      },
    },
    // ***** Here Comes the Cavalry *****
    {
      id: 'Zadnor Cavalry Gust Slash',
      type: 'StartsUsing',
      netRegex: { source: 'Clibanarius', id: '5D7D' },
      condition: (data) => data.ce === 'cavalry',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      response: Responses.knockback(),
    },
    {
      id: 'Zadnor Cavalry Raw Steel',
      type: 'StartsUsing',
      netRegex: { source: 'Clibanarius', id: '5D87' },
      condition: (data) => data.ce === 'cavalry',
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          avoidCharge: {
            en: 'Avoid Charge',
            de: 'ausweichen',
            fr: 'Évitez les charges',
            ja: '突進避けて',
            cn: '躲避冲锋',
            ko: '돌진 피해요',
          },
          runAway: {
            en: 'Run Away From Boss',
            de: 'Renn weg vom Boss',
            fr: 'Courez loin du boss',
            ja: 'ボスから離れる',
            cn: '远离Boss',
            ko: '보스에게서 먼곳으로',
          },
        };
        if (matches.target === data.me)
          return { alertText: output.runAway() };
        return { infoText: output.avoidCharge() };
      },
    },
    {
      id: 'Zadnor Cavalry Call Raze',
      type: 'StartsUsing',
      netRegex: { source: 'Clibanarius', id: '5D8C', capture: false },
      condition: (data) => data.ce === 'cavalry',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Cavalry Magitek Blaster',
      type: 'StartsUsing',
      netRegex: { source: 'Clibanarius', id: '5D90' },
      condition: (data) => data.ce === 'cavalry',
      response: Responses.stackMarkerOn(),
    },
    // ***** Head of the Snake *****
    // ***** There Would Be Blood *****
    {
      id: 'Zadnor Blood Cloud Of Locusts',
      type: 'StartsUsing',
      netRegex: { source: 'Hanbi', id: '5C10', capture: false },
      condition: (data) => data.ce === 'blood',
      response: Responses.getOut(),
    },
    {
      id: 'Zadnor Blood Plague Of Locusts',
      type: 'StartsUsing',
      netRegex: { source: 'Hanbi', id: '5C11', capture: false },
      condition: (data) => data.ce === 'blood',
      response: Responses.getIn(),
    },
    {
      id: 'Zadnor Blood Dread Wind',
      type: 'StartsUsing',
      netRegex: { source: 'Hanbi', id: '5BAE', capture: false },
      condition: (data) => data.ce === 'blood',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Blood Gale Cannon',
      type: 'StartsUsing',
      netRegex: { source: 'Hanbi', id: '53E3', capture: false },
      condition: (data) => data.ce === 'blood',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: should this be a response/output?
          en: 'Out of Front',
          de: 'Weg von Vorne',
          fr: 'À l\'extérieur du devant',
          cn: '避开正面',
          ko: '정면 피해요',
        },
      },
    },
    {
      id: 'Zadnor Blood Camisado',
      type: 'StartsUsing',
      netRegex: { source: 'Hanbi', id: '5BAE' },
      condition: tankBusterOnParty('blood'),
      response: Responses.tankBuster(),
    },
    // ***** Never Cry Wolf *****
    {
      id: 'Zadnor Wolf Glaciation',
      type: 'StartsUsing',
      netRegex: { source: 'Hrodvitnir', id: '5C32', capture: false },
      condition: (data) => data.ce === 'wolf',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Wolf Storm Without',
      type: 'StartsUsing',
      netRegex: { source: 'Hrodvitnir', id: '5C2A', capture: false },
      condition: (data) => data.ce === 'wolf',
      response: Responses.getUnder(),
    },
    {
      id: 'Zadnor Wolf Storm Within',
      type: 'StartsUsing',
      netRegex: { source: 'Hrodvitnir', id: '5C2C', capture: false },
      condition: (data) => data.ce === 'wolf',
      response: Responses.getOut(),
    },
    {
      id: 'Zadnor Wolf Bracing Wind',
      type: 'StartsUsing',
      netRegex: { source: 'Ice Sprite', id: '5C22' },
      condition: (data) => data.ce === 'wolf',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback (behind pillar)',
          de: 'Rückstoß (hinter dem Eissplitter)',
          fr: 'Poussée (derrière le pilier)',
          cn: '击退到柱子后',
          ko: '기둥 뒤로 넉백',
        },
      },
    },
    {
      id: 'Zadnor Wolf Lunar Cry',
      type: 'StartsUsing',
      netRegex: { source: 'Hrodvitnir', id: '5C24', capture: false },
      condition: (data) => data.ce === 'wolf',
      // Call this out after Bracing Wind.
      delaySeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hide Behind Pillar',
          de: 'Hinter dem Eissplitter verstecken',
          fr: 'Cachez-vous derrière le pilier',
          cn: '躲在柱子后',
          ko: '기둥 뒤에 숨어요',
        },
      },
    },
    // ***** Time To Burn *****
    {
      id: 'Zadnor Time Fire IV',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Belias', id: '5D9A', capture: false },
      condition: (data) => data.ce === 'time',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Time Fire',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Belias', id: '5D99' },
      condition: tankBusterOnParty('time'),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Time Reproduce',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Belias', id: '60E9', capture: false },
      condition: (data) => data.ce === 'time',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Avoid Dashes',
          de: 'Sprint ausweichen',
          fr: 'Évitez les ruées',
          ja: 'ブレードを避ける',
          cn: '躲开冲锋',
          ko: '돌진 피해요',
        },
      },
    },
    {
      id: 'Zadnor Time Time Bomb',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Belias', id: '5D95', capture: false },
      condition: (data) => data.ce === 'time',
      infoText: (data, _matches, output) => {
        data.timeBombCount = (data.timeBombCount ?? 0) + 1;
        // Belias alternates 2 and 3 Time Bombs, starting with 2.
        return data.timeBombCount % 2 ? output.twoClocks() : output.threeClocks();
      },
      outputStrings: {
        twoClocks: {
          en: 'Go Perpendicular To Clock Hands',
          de: 'Geh Senkrecht von den Uhrzeigern',
          fr: 'Aller perpendiculairement aux aiguilles de l\'horloge',
          cn: '垂直于时钟指针移动',
          ko: '시계바늘의 수직 방향으로',
        },
        threeClocks: {
          // This is...not the best instruction.  The real instruction is "if all clock hands are
          // parallel then go perpendicular, HOWEVER if exactly one clock hand is perpendicular
          // to the other two, then go where it points", which is several novels too long for
          // trigger text.  However, given that we explain two clocks, it feels wrong to not
          // have a trigger for three clocks.  "Mechanics Are Happening <se.6>"
          en: 'Dodge Three Clocks',
          de: 'Weiche den 3 Uhren aus',
          fr: 'Esquivez 3 horloges',
          cn: '躲避3个时钟',
          ko: '시계 3개 피해요',
        },
      },
    },
    // ***** Lean, Mean, Magitek Machines *****
    {
      id: 'Zadnor Machines Magnetic Field',
      type: 'StartsUsing',
      netRegex: { source: 'Kampe', id: '5CFE', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Machines Fore-Hind Cannons',
      type: 'StartsUsing',
      netRegex: { source: 'Kampe', id: '5CFF', capture: false },
      response: Responses.goSides(),
    },
    // ***** Worn to a Shadow *****
    {
      id: 'Zadnor Shadow Bladed Beak',
      type: 'StartsUsing',
      // Not a cleave.
      netRegex: { source: 'Alkonost', id: '5E3B' },
      condition: tankBusterOnParty('shadow'),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Shadow Nihility\'s Song',
      type: 'StartsUsing',
      netRegex: { source: 'Alkonost', id: '5E3C', capture: false },
      condition: (data) => data.ce === 'shadow',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Shadow Stormcall',
      type: 'StartsUsing',
      netRegex: { source: 'Alkonost', id: '5E39', capture: false },
      condition: (data) => data.ce === 'shadow',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Follow Slow Orb',
          de: 'Folge dem langsamen Orb',
          fr: 'Suivez l\'orbe lente',
          cn: '跟随慢速球',
          ko: '느린 구슬 따라가요',
        },
      },
    },
    {
      id: 'Zadnor Shadow Stormcall Away',
      type: 'StartsUsing',
      netRegex: { source: 'Alkonost', id: '5E39', capture: false },
      condition: (data) => data.ce === 'shadow',
      delaySeconds: 15,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away From Orb',
          de: 'Weg vom Orb',
          fr: 'Éloignez-vous de l\'orbe',
          cn: '远离球球',
          ko: '구슬 피해요',
        },
      },
    },
    // ***** A Familiar Face *****
    {
      id: 'Zadnor Face Ancient Quake IV',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Hashmal', id: '5D14', capture: false },
      condition: (data) => data.ce === 'face',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Face Rock Cutter',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Hashmal', id: '5D13' },
      condition: tankBusterOnParty('face'),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Face Extreme Edge Left',
      type: 'StartsUsing',
      netRegex: { source: 'Phantom Hashmal', id: '5D0E', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Find Phantom; Dodge Left',
          de: 'Finde das Abbild; weiche Links aus',
          fr: 'Trouvez le Double : Esquivez à gauche',
          cn: '寻找幻影; 向左躲避',
          ko: '분신 찾고, 왼쪽으로 피해요',
        },
      },
    },
    {
      id: 'Zadnor Face Extreme Edge Right',
      type: 'StartsUsing',
      netRegex: { source: 'Phantom Hashmal', id: '5D0D', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Find Phantom; Dodge Right',
          de: 'Finde das Abbild; weiche Rechts aus',
          fr: 'Trouvez le Double : Esquivez à droite',
          cn: '寻找幻影; 向右躲避',
          ko: '분신 찾고, 오른쪽으로 피해요',
        },
      },
    },
    {
      id: 'Zadnor Face Hammer Round',
      type: 'Ability',
      netRegex: { source: '4th-Make Hashmal', id: '5D10', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away From Hammer; Rotate Outside',
          de: 'Weg vom Hammer; nach Außen rotieren',
          fr: 'Éloignez-vous du marteau; Tournez à l\'extérieur',
          cn: '远离锤子; 向外旋转',
          ko: '해머로 부터 멀어지고, 바깥쪽 계속 돌아요',
        },
      },
    },
    // ***** Looks to Die For *****
    {
      id: 'Zadnor Looks Forelash',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DA9', capture: false },
      condition: (data) => data.ce === 'looks',
      response: Responses.getBehind(),
    },
    {
      id: 'Zadnor Looks Backlash',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DAA', capture: false },
      condition: (data) => data.ce === 'looks',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: should this be a response/output?
          en: 'Get In Front',
          de: 'Geh vor den Boss',
          fr: 'Passez devant',
          ja: 'ボスの正面へ',
          cn: '去Boss正面',
          ko: '보스 앞으로',
        },
      },
    },
    {
      id: 'Zadnor Looks Twisting Winds',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DA2', capture: false },
      condition: (data) => data.ce === 'looks',
      response: Responses.goSides(),
    },
    {
      id: 'Zadnor Looks Roar',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DAD', capture: false },
      condition: (data) => data.ce === 'looks',
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Looks Serpent\'s Edge',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DB1' },
      condition: tankBusterOnParty('looks'),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Looks Levinbolt',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DB0' },
      condition: (data, matches) => data.ce === 'looks' && data.me === matches.target,
      response: Responses.spread(),
    },
    {
      id: 'Zadnor Looks Thundercall',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5D9C', capture: false },
      condition: (data) => data.ce === 'looks',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Avoid Orbs -> Under Orbs',
          de: 'Weiche Orbs aus -> Unter die Orbs',
          fr: 'Évitez les orbes -> En dessous les orbes',
          cn: '避开球 -> 去球下',
          ko: '구슬 피하고 -> 구슬 밑으로',
        },
      },
    },
    {
      id: 'Zadnor Looks Flame',
      type: 'StartsUsing',
      netRegex: { source: 'Ayida', id: '5DA6', capture: false },
      condition: (data) => data.ce === 'looks',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: this is also an aoe, and this is a pretty poor description.
          en: 'Go to small orb',
          de: 'Geh zum kleinen Orb',
          fr: 'Allez à la petite orbe',
          cn: '去小球',
          ko: '작은 구슬로',
        },
      },
    },
    // ***** Taking the Lyon's Share *****
    // ***** The Dalriada *****
    {
      id: 'Zadnor Sartauvoir Pyrokinesis',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E7D', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Sartauvoir Time Eruption',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: ['5E6C', '5E83'], capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to Slow Clocks',
          de: 'Geh zu den langsamen Uhren',
          fr: 'Allez sur les horloges lentes',
          cn: '去慢时钟',
          ko: '느린 시계로',
        },
      },
    },
    {
      id: 'Zadnor Sartauvoir Reverse Time Eruption',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: ['5E6D', '5E84'], capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to Fast Clocks',
          de: 'Geh zu den schnellen Uhren',
          fr: 'Allez sur les horloges rapides',
          cn: '去快时钟',
          ko: '빠른 시계로',
        },
      },
    },
    {
      id: 'Zadnor Sartauvoir Phenex',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: ['5E72', '5E85'], capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bird Dashes',
          de: 'Vogel-Anstürme',
          fr: 'Plongeons des oiseaux',
          cn: '躲避红鸟',
          ko: '붉은새 돌진 피해요',
        },
      },
    },
    {
      id: 'Zadnor Sartauvoir Hyperpyroplexy',
      type: 'Ability',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E76', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Towers',
          de: 'Türme nehmen',
          fr: 'Prenez les tours',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '타워 하나씩 밟아요',
        },
      },
    },
    {
      id: 'Zadnor Sartauvoir Burning Blade',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E90' },
      condition: tankBusterOnParty(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Sartauvoir Pyrocrisis',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E8F' },
      preRun: (data, matches) => {
        data.sartauvoirPyrocrisis ??= [];
        data.sartauvoirPyrocrisis.push(matches.target);
      },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text();
      },
      outputStrings: {
        text: Outputs.spread,
      },
    },
    {
      id: 'Zadnor Sartauvoir Pyrodoxy',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E8E' },
      delaySeconds: 0.5,
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.stackOnYou();
        if (data.sartauvoirPyrocrisis && !data.sartauvoirPyrocrisis.includes(data.me))
          return output.stackOnTarget({ player: data.party.member(matches.target) });
      },
      run: (data) => delete data.sartauvoirPyrocrisis,
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOnTarget: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'Zadnor Sartauvoir Mannatheihwon Flame Warning',
      type: 'Ability',
      // Triggered after Burning Blade.
      // TODO: does this ever happen again??
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E90', capture: false },
      suppressSeconds: 999999,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack together to bait Ignis Est',
          de: 'Versammeln um Ignis Est zu ködern',
          fr: 'Packez-vous pour attirer l\'Ignis Est',
          cn: '集合诱导是为烈火',
          ko: '보스 앞에서 뭉쳐요',
        },
      },
    },
    {
      id: 'Zadnor Sartauvoir Mannatheihwon Flame',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E87', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Sartauvoir Mannatheihwon Flame Away',
      type: 'Ability',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E87', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get far away from X charges',
          de: 'Weit weg von den X Anstürmen',
          fr: 'Éloignez-vous des charges X',
          cn: '远离X冲锋',
          ko: 'X 돌진에서 멀리 떨어져요',
        },
      },
    },
    {
      id: 'Zadnor Sartauvoir Left Brand',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E8C', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Zadnor Sartauvoir Right Brand',
      type: 'StartsUsing',
      netRegex: { source: 'Sartauvoir The Inferno', id: '5E8B', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Zadnor Blackburn Magitek Rays',
      type: 'StartsUsing',
      netRegex: { source: '4th Legion Blackburn', id: '5F12', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Blackburn Analysis',
      type: 'StartsUsing',
      netRegex: { source: '4th Legion Blackburn', id: '5F0F', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Opening Toward Undodgeable Line',
          de: 'Öffnen in Richtung der nicht ausweichbaren Linie',
          fr: 'Ouverture dans une ligne inesquivable',
          cn: '开口朝向无法躲避的线',
          ko: '피할 수 없는쪽으로 열린 곳 맞추기',
        },
      },
    },
    {
      id: 'Zadnor Blackburn Augur Sanctified Quake III',
      type: 'StartsUsing',
      netRegex: { id: '5F20', capture: false },
      suppressSeconds: 1,
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Augur Pyroplexy',
      type: 'Ability',
      netRegex: { source: '4th Legion Augur', id: '5F1B', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Towers',
          de: 'Türme nehmen',
          fr: 'Prenez les tours',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '타워 하나씩 들어가요',
        },
      },
    },
    {
      id: 'Zadnor Augur Turbine',
      type: 'StartsUsing',
      netRegex: { source: 'Flameborne Zirnitra', id: '5F14' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack + Knockback to Safe Spot',
          de: 'Sammeln + Rückstoß in den sicheren Bereich',
          fr: 'Package + Poussée vers un endroit safe',
          cn: '集合 + 向安全区击退',
          ko: '뭉쳐서 + 안전한 곳으로 넉백',
        },
      },
    },
    {
      id: 'Zadnor Alkonost Wind',
      type: 'StartsUsing',
      // 5F21 = North Wind
      // 5F22 = South Wind
      netRegex: { source: 'Tamed Carrion Crow', id: ['5F21', '5F22'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      response: Responses.knockback(),
    },
    {
      id: 'Zadnor Alkonost Stormcall Away',
      type: 'StartsUsing',
      netRegex: { source: 'Tamed Alkonost', id: '5F26', capture: false },
      delaySeconds: 18,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away From Orb',
          de: 'Weg vom Orb',
          fr: 'Éloignez-vous de l\'orbe',
          cn: '远离球球',
          ko: '구슬 피해요',
        },
      },
    },
    {
      id: 'Zadnor Alkonost Nihility\'s Song',
      type: 'StartsUsing',
      netRegex: { source: 'Alkonost', id: '5F28', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Cuchulainn March',
      type: 'GainsEffect',
      // 871 = Forward March
      // 872 = About Face
      // 873 = Left Face
      // 874 = Right Face
      netRegex: { source: '4th-Make Cuchulainn', effectId: ['871', '872', '873', '874'] },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        const effectId = matches.effectId.toUpperCase();
        if (effectId === '871')
          return output.forward();
        if (effectId === '872')
          return output.backward();
        if (effectId === '873')
          return output.left();
        if (effectId === '874')
          return output.right();
      },
      outputStrings: {
        forward: {
          en: 'March Forward (avoid puddles)',
          de: 'Marchiere Vorwärts (weiche den Flächen aus)',
          fr: 'Marche en avant (évitez les zones au sol)',
          cn: '强制移动: 前, 避开圈圈',
          ko: '강제이동: 앞 🔜 장판 피해요',
        },
        backward: {
          en: 'March Backward (avoid puddles)',
          de: 'Marchiere Rückwärts (weiche den Flächen aus)',
          fr: 'Marche en arrière (évitez les zones au sol)',
          cn: '强制移动: 后, 避开圈圈',
          ko: '강제이동: 뒤 🔜 장판 피해요',
        },
        left: {
          en: 'March Left (avoid puddles)',
          de: 'Marchiere Links (weiche den Flächen aus)',
          fr: 'Marche à gauche (évitez les zones au sol)',
          cn: '强制移动: 左, 避开圈圈',
          ko: '강제이동: 왼쪽 🔜 장판 피해요',
        },
        right: {
          en: 'March Right (avoid puddles)',
          de: 'Marchiere Rechts (weiche den Flächen aus)',
          fr: 'Marche à droite (évitez les zones au sol)',
          cn: '强制移动: 右, 避开圈圈',
          ko: '강제이동: 오른쪽 🔜 장판 피해요',
        },
      },
    },
    {
      id: 'Zadnor Cuchulainn Might Of Malice',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Cuchulainn', id: '5C92' },
      condition: tankBusterOnParty(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Cuchulainn Putrified Soul',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Cuchulainn', id: '5C8F', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Cuchulainn Fleshy Necromass',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Cuchulainn', id: '5C82', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get In Puddle',
          de: 'Geh in die Flächen',
          fr: 'Prenez une zone au sol',
          cn: '进入圈圈',
          ko: '장판 밟아요',
        },
      },
    },
    {
      id: 'Zadnor Cuchulainn Necrotic Billow',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Cuchulainn', id: '5C86', capture: false },
      // Normally wouldn't call out ground markers, but this can look a lot like Ambient Pulsation.
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Avoid Chasing AOEs',
          de: 'Weiche den verfolgenden AoEs aus',
          fr: 'Évitez les AoEs',
          cn: '躲避追踪AOE',
          ko: '따라오는 장판 피해요',
        },
      },
    },
    {
      id: 'Zadnor Cuchulainn Ambient Pulsation',
      type: 'StartsUsing',
      netRegex: { source: '4th-Make Cuchulainn', id: '5C8E', capture: false },
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: this is "titan line bombs".  Is there a better wording here?
          en: 'Go to third line',
          de: 'Geh zur 3. Linie',
          fr: 'Allez à la troisième ligne',
          cn: '去第三行',
          ko: '세번째 장판으로',
        },
      },
    },
    {
      id: 'Zadnor Cuchulainn Fell Flow',
      type: 'HeadMarker',
      netRegex: { id: '0028' },
      condition: (data, matches) => data.ce === 'dalriadaCuchulainn' && data.me === matches.target,
      response: Responses.earthshaker(),
    },
    {
      id: 'Zadnor Saunion High-Powered Magitek Ray',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: '5DC5' },
      response: Responses.tankCleave(),
    },
    {
      id: 'Zadnor Saunion Magitek Halo',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: '5DB5', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Zadnor Saunion Magitek Crossray',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: '5DB7', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go Intercardinals',
          de: 'Geh zu Interkardinalen Richtungen',
          fr: 'Allez en intercardinal',
          cn: '去四角',
          ko: '비스듬히',
        },
      },
    },
    {
      id: 'Zadnor Saunion Mobile Halo',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: ['5DB9', '5DBA', '5DBB', '5DBC'], capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Under (towards charge)',
          de: 'Geh unter den Boss (zum Ansturm hin)',
          fr: 'Passez en dessous (vers la charge)',
          cn: '去下方 (朝向冲锋方向)',
          ko: '보스 밑으로 (화살표 따라가기)',
        },
      },
    },
    {
      id: 'Zadnor Saunion Mobile Crossray',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: ['5DBD', '5DBE', '5DBF', '5DC0'], capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go Intercards (away from charge)',
          de: 'Geh zu Interkardinalen Richtungen (weg vom Ansturm)',
          fr: 'Allez en intercardinal (éloignez-vous de la charge)',
          cn: '去四角 (躲避冲锋)',
          ko: '비스듬히 (화살표쪽 피하기)',
        },
      },
    },
    {
      id: 'Zadnor Saunion Anti-Personnel Missile',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: '5DC2' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Zadnor Saunion Missile Salvo',
      type: 'StartsUsing',
      netRegex: { source: 'Saunion', id: '5DC3' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Zadnor Saunion Wildfire Winds',
      type: 'StartsUsing',
      netRegex: { source: 'Dawon The Younger', id: '5DCD', capture: false },
      delaySeconds: 10,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          // TODO: during spiral scourge could be "get under middle/outer light orb"?
          en: 'Get Under Light Orb',
          de: 'Unter einem Lichtorb stellen',
          fr: 'Allez sous un orbe lumineux',
          ja: '白玉へ',
          cn: '靠近白球',
          ko: '하얀 구슬 안으로',
        },
      },
    },
    {
      id: 'Zadnor Saunion Tooth and Talon',
      type: 'StartsUsing',
      netRegex: { source: 'Dawon The Younger', id: '5DD4' },
      condition: tankBusterOnParty(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Zadnor Saunion Swooping Frenzy',
      type: 'StartsUsing',
      netRegex: { source: 'Dawon The Younger', id: '5DD0', capture: false },
      infoText: (data, _matches, output) => {
        // Every other Swooping Frenzy is followed by a Frigid Pulse, starting with the first.
        data.saunionSwoopingCount = (data.saunionSwoopingCount ?? 0) + 1;
        if (data.saunionSwoopingCount % 2)
          return output.text();
      },
      outputStrings: {
        text: {
          en: 'Follow Dawon',
          de: 'Folge Dawon',
          fr: 'Suivez Dawon',
          cn: '跟随小达温',
          ko: '다우언 따라가요',
        },
      },
    },
    {
      id: 'Zadnor Diablo Advanced Death Ray',
      type: 'HeadMarker',
      netRegex: { id: '00E6' },
      condition: (data) => data.ce === 'dalriadaDiablo',
      // TODO: this is maybe worth promoting to responses?
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankLaserOnYou: {
            en: 'Tank Laser on YOU',
            de: 'Tank Laser auf DIR',
            fr: 'Tank laser sur VOUS',
            ja: '自分にタンクレーザー',
            cn: '坦克激光点名',
            ko: '내게 탱크 레이저',
          },
          avoidTankLaser: {
            en: 'Avoid Tank Laser',
            de: 'Weiche dem Tanklaser aus',
            fr: 'Évitez le tank laser',
            cn: '躲避坦克激光',
            ko: '탱크 레이저 피해요',
          },
        };
        if (data.me === matches.target)
          return { alarmText: output.tankLaserOnYou() };
        return { infoText: output.avoidTankLaser() };
      },
    },
    {
      id: 'Zadnor Diablo Aetheric Explosion',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CC6', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Diablo Ultimate Psuedoterror',
      type: 'StartsUsing',
      // This is triggered on Diabolic Gate with a delay, so it gives an extra +4 seconds.
      netRegex: { source: 'The Diablo Armament', id: '5C9F', capture: false },
      delaySeconds: 37,
      response: Responses.getUnder(),
    },
    {
      id: 'Zadnor Diablo Advanced Death IV',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CAF', capture: false },
      // Circles appear at the end of the cast.
      delaySeconds: 4,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Avoid Growing Circles',
          de: 'Weiche den wachsenden Kreisen aus',
          fr: 'Évitez les cercles grandissants',
          cn: '躲避变大圈圈',
          ko: '커지는 장판 피해요',
        },
      },
    },
    {
      id: 'Zadnor Diablo Advanced Death IV Followup',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CAF', capture: false },
      delaySeconds: 12,
      // TODO: or "Avoid Growing Circles (again lol)"?
      response: Responses.moveAway(),
    },
    {
      id: 'Zadnor Diablo Aetheric Boom Raidwide',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CB3', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zadnor Diablo Aetheric Boom Balloons',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CB3', capture: false },
      // Don't warn people to preposition here, because they probably need
      // heals after the initial hit before popping these.
      delaySeconds: 5.5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Pop Balloons',
          de: 'Orbs nehmen',
          fr: 'Apparition des boules',
          cn: '吃球',
          ko: '풍선 부딪혀요',
        },
      },
    },
    {
      id: 'Zadnor Diablo Deadly Dealing',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CC2' },
      // TODO: these feel really late with 5 seconds, should they call instantly at 7?
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      alertText: (data, _matches, output) => {
        data.diabloDealingCount = (data.diabloDealingCount ?? 0) + 1;
        return data.diabloDealingCount % 2 ? output.knockbackBits() : output.knockbackNox();
      },
      outputStrings: {
        knockbackBits: {
          en: 'Knockback (away from bits)',
          de: 'Rückstoß (Weg von den Magiteks)',
          fr: 'Poussée (éloignez-vous des drones)',
          cn: '击退 (避开浮游炮)',
          ko: '넉백 (비트 피해요)',
        },
        knockbackNox: {
          en: 'Knockback (into empty corner)',
          de: 'Rückstoß (in die leere Ecke)',
          fr: 'Poussée (dans un coin vide)',
          cn: '击退 (进入空角落)',
          ko: '안전한 곳으로 넉백',
        },
      },
    },
    {
      id: 'Zadnor Diablo Void Systems Overload',
      type: 'StartsUsing',
      netRegex: { source: 'The Diablo Armament', id: '5CB7', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Zadnor Diablo Pillar Of Shamash Spread',
      type: 'HeadMarker',
      // 5CBC damage
      netRegex: { id: '0017' },
      condition: (data) => data.ce === 'dalriadaDiablo',
      preRun: (data, matches) => {
        data.diabloPillar ??= [];
        data.diabloPillar.push(matches.target);
      },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text();
      },
      outputStrings: {
        text: {
          en: 'Laser on YOU',
          de: 'Laser auf DIR',
          fr: 'Laser sur VOUS',
          cn: '激光点名',
          ko: '내게 레이저',
        },
      },
    },
    {
      id: 'Zadnor Diablo Pillar Of Shamash Stack',
      type: 'HeadMarker',
      // 5CBE damage (no headmarker???)
      netRegex: { id: '0017', capture: false },
      condition: (data) => data.ce === 'dalriadaDiablo',
      delaySeconds: 3,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (!data.diabloPillar || !data.diabloPillar.includes(data.me))
          return output.text();
      },
      run: (data) => delete data.diabloPillar,
      outputStrings: {
        text: {
          en: 'Line Stack',
          de: 'In einer Linie sammeln',
          fr: 'Package en ligne',
          ja: '直線頭割り',
          cn: '直线分摊',
          ko: '뭉쳐요',
        },
      },
    },
    {
      id: 'Zadnor Diablo Acceleration Bomb Dodge',
      type: 'GainsEffect',
      netRegex: { effectId: 'A61' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      infoText: (_data, matches, output) => {
        // Durations are 7 and 12.
        const duration = parseFloat(matches.duration);
        return duration > 10 ? output.dodgeFirst() : output.dodgeSecond();
      },
      outputStrings: {
        dodgeFirst: {
          en: '(Dodge -> Stop)',
          de: '(Ausweichen -> Stop)',
          fr: '(Esquivez -> Arrêtez)',
          cn: '(躲避 -> 停停停)',
          ko: '(피하고 -> 멈춰요)',
        },
        dodgeSecond: {
          en: '(Stop -> Dodge)',
          de: '(Stop -> Ausweichen)',
          fr: '(Arrêtez -> Esquivez)',
          cn: '(停停停 -> 躲避)',
          ko: '(멈췄다 -> 피해요)',
        },
      },
    },
    {
      id: 'Zadnor Diablo Acceleration Bomb Stop',
      type: 'GainsEffect',
      netRegex: { effectId: 'A61' },
      condition: Conditions.targetIsYou(),
      // TODO: this could be better timed to be later for the dodge -> stop version and earlier
      // for the stop -> dodge.
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3.5,
      response: Responses.stopEverything(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Left Brand/Right Brand': 'Left/Right Brand',
        'Time Eruption/Reverse Time Eruption': '(Reverse?) Time Eruption',
        'North Wind/South Wind': 'North/South Wind',
        'Magitek Halo/Magitek Crossray': 'Magitek Halo/Crossray',
        'Magitek Crossray/Magitek Halo': 'Magitek Crossray/Halo',
        'Mobile Halo/Mobile Crossray': 'Mobile Halo/Crossray',
        'Mobile Crossray/Mobile Halo': 'Mobile Crossray/Halo',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        '(?<!Tamed )Alkonost': 'Alkonost',
        'Ayida': 'Ayida',
        '4Th Legion Augur': 'Augur der IV\\. Legion',
        '4Th Legion Blackburn': 'Schwarzbrand der IV\\. Legion',
        '4th-Make Belias': 'Belias der IV\\. Legion',
        '4Th-Make Cuchulainn': 'Cuchulainn der IV\\. Legion',
        '4th-Make Hashmal': 'Hashmallim der IV\\. Legion',
        '4th-Make Shemhazai': 'Shemhazai der IV\\. Legion',
        '(?<!4Th Legion )Blackburn': 'Schwarzbrand',
        'Clibanarius': 'Clibanarius',
        'Dawon The Younger': 'Dawon junior',
        'Diabolic Bit': 'Diablo-Drohne',
        'Dyunbu the Accursed': 'Dyunbu (?:der|die|das) Unlauter(?:e|er|es|en)',
        'Flameborne Zirnitra': 'Flammen-Zirnitra',
        'Hanbi': 'Hanbi',
        'Hedetet': 'Hedetet',
        'Hrodvitnir': 'Hrodvitnir',
        'Huma': 'Homa',
        'Ice Sprite': 'Eis-Exergon',
        'Ignis Est': 'Ignis Est',
        'Kampe': 'Kampe',
        'Magitek Development': 'Bereich Magitek-Forschung',
        'Phantom Hashmal': 'Hashmallims Abbild',
        'Sartauvoir The Inferno': 'Sartauvoir Eisenfeuer',
        'Saunion': 'Saunion',
        'Stormborne Zirnitra': 'Sturm-Zirnitra',
        'Tamed Alkonost(?!\'s Shadow)': 'gebändigt(?:e|er|es|en) Alkonost',
        'Tamed Alkonost\'s Shadow': 'gebändigt(?:e|er|es|en) Alkonost',
        'Tamed Carrion Crow': 'gebändigt(?:e|er|es|en) Aaskrähe',
        'The Diablo Armament': 'Diablo-Armament',
        'The fallen ring': 'Eingestürzte Grube',
        'The flagship landing': 'Kriegsschiff-Ankerplatz',
        'The greater hold': 'Großer Stauraum',
        'The loading dock': 'Ladebereich',
        'Vermilion Flame': 'feurig(?:e|er|es|en) Glut',
        'Vortical Orb': 'Magiewindkugel',
        'Waveborne Zirnitra': 'Wellen-Zirnitra',
      },
      'replaceText': {
        '--lasers--': '--Laser--',
        '--line stack--': '--In Linie sammeln--',
        '74 Degrees': 'Wassergeschoss',
        'Advanced Death IV': 'Super-Todka',
        'Advanced Death Ray': 'Super-Todesstrahl',
        'Advanced Nox': 'Super-Nox',
        'Aetheric Boom': 'Ätherknall',
        'Aetheric Explosion': 'Ätherische Explosion',
        'Aetherochemical Laser': 'Ätherochemischer Laser',
        'Ambient Pulsation': 'Ätherwulst',
        'Analysis': 'Analyse',
        'Anti-Personnel Missile': 'Antipersonenrakete',
        'Assault Cannon': 'Sturmkanone',
        'Ballistic Impact': 'Ballistischer Einschlag',
        'Broadside Barrage': 'Längssalve',
        'Burgeoning Dread': 'Welle der Angst',
        'Burn(?!ing)': 'Verbrennung',
        'Burning Blade': 'Brandklinge',
        'Deadly Dealing': 'Todeswatsche',
        'Diabolic Gate': 'Diabolisches Tor',
        'Double Cast': 'Doppelzauber',
        'Explosion': 'Explosion',
        'Fell Flow': 'Strom der Verdorbenheit',
        'Fire Brand': 'Majestätisches Kreuz',
        'Flamedive': 'Flammentaucher',
        'Flaming Cyclone': 'Flammenzyklon',
        'Fleshy Necromass': 'Todespresse',
        'Foreshadowing': 'Vorahnung',
        'Frigid Pulse': 'Froststoß',
        'Ghastly Aura': 'Verlustwelle',
        'Grand Crossflame': 'Große Kreuzflamme',
        'High-Powered Magitek Ray': 'Hochenergetischer Magitek-Laser',
        'Hyperpyroplexy': 'Hyper-Pyroplexie',
        'Ignis Est': 'Ignis Est',
        'Immolate': 'Opferung',
        'Left Brand': 'Feuerzeichen links',
        'Light Pseudopillar': 'Lichtsäule der Ätherochemie',
        'Magitek Bit': 'Magitek-Bit',
        'Magitek Crossray': 'Magitek-Kreuzlaser',
        'Magitek Halo': 'Magitek-Brennkreis',
        'Mannatheihwon Flame': 'Mannatheihwo-Flamme',
        'Might Of Malice': 'Trampelausbruch',
        'Missile Command': 'Raketenkommando',
        'Missile Salvo': 'Mehrfach-Rakete',
        'Mobile Crossray': 'Transfer-Kreuzlaser',
        'Mobile Halo': 'Transfer-Brennkreis',
        'Necrotic Billow': 'Fäulnisbrand',
        'Nihility\'s Song': 'Nihilismuslied',
        'North Wind': 'Nordwind',
        'Obey': 'Gehorchen',
        '(?<!Verd)Orb': 'Kugel',
        'Pain Storm': 'Schmerzsturm',
        'Painful Gust': 'Schmerzhafte Böe',
        'Pentagust': 'Pentagast',
        'Phenex': 'Phenex',
        'Pillar Of Shamash': 'Shams Säule',
        'Putrified Soul': 'Unreine Welle',
        'Pyrocrisis': 'Pyrokrise',
        'Pyrodoxy': 'Pyrodoxie',
        'Pyrokinesis': 'Pyrokinese',
        '(?<![-r])Pyroplexy': 'Pyroplexie',
        'Raw Heat': 'Flammende Welle',
        'Read Orders: Field Support': 'Befehl: Infanterieverstärkung',
        'Reverse Time Eruption': 'Umgekehrte Zeiteruption',
        'Right Brand': 'Feuerzeichen rechts',
        'Ruinous Pseudomen': 'Ruinöses Omen der Ätherochemie',
        'Sanctified Quake III': 'Gesegnetes Seisga',
        'South Wind': 'Südwind',
        'Spiral Scourge': 'Spiralspießer',
        'Stormborne Zirnitra': 'Flammen-Zirnitra',
        'Stormcall': 'Sturmruf',
        'Suppressive Magitek Rays': 'Omnidirektionaler Magitek-Laser',
        'Surface Missile': 'Raketenschlag',
        'Swooping Frenzy': 'Heftiges Schütteln',
        'Terminus Est': 'Terminus Est',
        'Thermal Gust': 'Thermalböe',
        '(?<!Reverse )Time Eruption': 'Zeiteruption',
        'Tooth And Talon': 'Krallen des Bestienkönigs',
        'Touchdown': 'Himmelssturz',
        'Turbine': 'Turbine',
        'Ultimate Pseudoterror': 'Ultimativer Terror der Ätherochemie',
        'Void Call': 'Helferlein',
        'Void Systems Overload': 'Modell-V-Amokfahrt',
        'Wildfire Winds': 'Majestätischer Windstoß',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '(?<!Tamed )Alkonost(?! dressé)': 'Alkonost',
        'Ayida': 'Ayida',
        '4Th Legion Augur': 'augure de la 4e légion',
        '4Th Legion Blackburn': 'Escarre de la 4e légion',
        '4th-Make Belias': 'Bélias de la 4e légion',
        '4Th-Make Cuchulainn': 'cúchulainn de la 4e légion',
        '4th-Make Hashmal': 'Hashmal de la 4e légion',
        '4th-Make Shemhazai': 'Shemhazai de la 4e légion',
        '(?<!4Th Legion )Blackburn': 'Escarre',
        'Clibanarius': 'Clibanarius',
        'Dawon The Younger': 'Dawon junior',
        'Diabolic Bit': 'drone de Diablo',
        'Dyunbu the Accursed': 'Dyunbu l\'impure',
        'Hanbi': 'Hanbi',
        'Hedetet': 'Hededèt',
        'Hrodvitnir': 'Hródvitnir',
        'Flameborne Zirnitra': 'zirnitra des flammes',
        'Huma': 'homa',
        'Ice Sprite': 'élémentaire de glace',
        'Ignis Est': 'Ignis Est',
        'Kampe': 'Campé',
        'Magitek Development': 'Section des recherches magitek',
        'Phantom Hashmal': 'double du Hashmal',
        'Sartauvoir The Inferno': 'Sartauvoir le fer rouge',
        'Saunion': 'Saunion',
        'Stormborne Zirnitra': 'zirnitra des tempêtes',
        'Tamed Alkonost(?!\'s Shadow)': 'alkonost dressé',
        'Tamed Alkonost\'s Shadow': 'ombre d\'Alkonost dressé',
        'Tamed Carrion Crow': 'corneille noire dressée',
        'The Diablo Armament': 'batterie d\'artillerie Diablo',
        'The fallen ring': 'Anneau effondré',
        'The flagship landing': 'Embarcadère du Dalriada',
        'The greater hold': 'Grande soute',
        'The loading dock': 'Aire de chargement',
        'Vermilion Flame': 'incandescence',
        'Vortical Orb': 'globe de vent maléfique',
        'Waveborne Zirnitra': 'zirnitra des torrents',
      },
      'replaceText': {
        '--lasers--': '--lasers',
        '--line stack': '--package en ligne--',
        '74 Degrees': 'Aqua-tir',
        'Advanced Death IV': 'Giga Mort renforcée',
        'Advanced Death Ray': 'Rayon de la mort renforcé',
        'Advanced Nox': 'Nox renforcée',
        'Aetheric Boom': 'Onde d\'éther',
        'Aetheric Explosion': 'Éther explosif',
        'Aetherochemical Laser': 'Laser magismologique',
        'Ambient Pulsation': 'Pulsation démoniaque',
        'Analysis': 'Analyse',
        'Anti-Personnel Missile': 'Pluie de missiles antipersonnel',
        'Assault Cannon': 'Canon d\'assaut',
        'Ballistic Impact': 'Impact de missile',
        'Broadside Barrage': 'Bourrasque latérale',
        'Burgeoning Dread': 'Vague de terreur',
        'Burn(?!ing)': 'Combustion',
        'Burning Blade': 'Lame calcinante',
        'Deadly Dealing': 'Fracas mortel',
        'Diabolic Gate': 'Porte d\'outre-monde',
        'Double Cast': 'Double incantation',
        'Explosion': 'Explosion',
        'Fell Flow': 'Torrent fangeux',
        'Fire Brand': 'Croix auguste',
        'Flamedive': 'Plongeon embrasé',
        'Flaming Cyclone': 'Cyclone de feu',
        'Fleshy Necromass': 'Écrasement malsain',
        'Foreshadowing': 'Préfiguration',
        'Frigid Pulse': 'Pulsation glaciale',
        'Ghastly Aura': 'Onde d\'amnésie',
        'Grand Crossflame': 'Croix suprême enflammée',
        'High-Powered Magitek Ray': 'Rayon magitek surpuissant',
        'Hyperpyroplexy': 'Hyperpyroplexie',
        'Ignis Est': 'Ignis Est',
        'Immolate': 'Immolation',
        'Left Brand/Right Brand': 'Marque au fer rouge gauche/droite',
        'Light Pseudopillar': 'Colonne lumineuse magismologique',
        'Magitek Bit': 'Éjection de drones',
        'Magitek Crossray/Magitek Halo': 'Rayon croisé/Cercle enflammé magitek',
        'Magitek Halo/Magitek Crossray': 'Cercle enflammé/Rayon croisé magitek',
        'Mannatheihwon Flame': 'Flamme de Mannatheihwo',
        'Might Of Malice': 'Coup de pied puissant',
        'Missile Command': 'Commande missile',
        'Missile Salvo': 'Salve de missiles',
        'Mobile Crossray/Mobile Halo': 'Rayon croisé/Cercle enflammé mobile',
        'Mobile Halo/Mobile Crossray': 'Cercle enflammé/Rayon croisé mobile',
        'Necrotic Billow': 'Immolation putréfiante',
        'Nihility\'s Song': 'Chant de la vacuité',
        'North Wind/South Wind': 'Vent de nord/sud',
        'Obey': 'À l\'écoute du maître',
        'Orb': 'Orbe',
        'Pain Storm': 'Tempête de douleur',
        'Painful Gust': 'Rafale suppliciante',
        'Pentagust': 'Pentasouffle',
        'Phenex': 'Phenex',
        'Pillar Of Shamash': 'Pilier de Shams',
        'Putrified Soul': 'Vague de souillure',
        'Pyrocrisis': 'Pyrocrisie',
        'Pyrodoxy': 'Pyrodoxie',
        'Pyrokinesis': 'Pyrokinésie',
        '(?<!r)Pyroplexy': 'Pyroplexie',
        'Raw Heat': 'Vague explosive',
        'Read Orders: Field Support': 'Ordre tactique : Infanterie de soutien',
        'Reverse Time Eruption( [0-9])': 'Éruption à devancement$1',
        'Ruinous Pseudomen': 'Mauvais présage magismologique',
        'Sanctified Quake III': 'Méga Séisme sanctifié',
        'Spiral Scourge': 'Spirale empalante',
        'Stormborne Zirnitra': 'zirnitra des flammes',
        'Stormcall': 'Appel des tempêtes',
        'Suppressive Magitek Rays': 'Rayon magitek tous azimuts',
        'Surface Missile': 'Missiles sol-sol',
        'Swooping Frenzy': 'Plongeon frénétique',
        'Terminus Est': 'Terminus Est',
        'Thermal Gust': 'Bourrasque incandescente',
        '(?<!Reverse )Time Eruption( [0-9])': 'Éruption à retardement$1',
        'Time Eruption/Reverse Time Eruption': 'Éruption à retardement/devancement',
        'Tooth And Talon': 'Lacération du Roi bestial',
        'Touchdown': 'Atterrissage',
        'Turbine': 'Turbine',
        'Ultimate Pseudoterror': 'Terreur ultime magismologique',
        'Void Call': 'Invocation',
        'Void Systems Overload': 'Surrégime du moteur \'V\'',
        'Wildfire Winds': 'Tempête de plumes auguste',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        '4Th Legion Augur': 'IVレギオン・アウグル',
        '4Th Legion Blackburn': 'IVレギオン・ブラックバーン',
        '4th-Make Belias': 'IVレギオン・ベリアス',
        '4Th-Make Cuchulainn': 'IVレギオン・キュクレイン',
        '4th-Make Hashmal': 'IVレギオン・ハシュマリム',
        '4th-Make Shemhazai': 'IVレギオン・シュミハザ',
        '(?<!4Th Legion )Blackburn': 'ブラックバーン',
        'Dawon The Younger': 'ドゥンJr\\.',
        'Diabolic Bit': 'ディアブロ・ビット',
        'Dyunbu the Accursed': '不浄のユンブ',
        'Flameborne Zirnitra': 'フレイム・ジルニトラ',
        'Huma': 'フマ',
        'Ice Sprite': 'アイススプライト',
        'Ignis Est': 'イグニス・エスト',
        'Magitek Development': '魔導研究区画',
        'Phantom Hashmal': 'ハシュマリムの幻影',
        'Sartauvoir The Inferno': '鉄火のサルトヴォアール',
        'Saunion': 'サウニオン',
        'Stormborne Zirnitra': 'ストーム・ジルニトラ',
        'Tamed Alkonost(?!\'s Shadow)': 'テイムド・アルコノスト',
        'Tamed Alkonost\'s Shadow': 'テイムド・アルコノストの影',
        'Tamed Carrion Crow': 'テイムド・キャリオンクロウ',
        'The Diablo Armament': 'ディアブロ・アーマメント',
        'The fallen ring': '崩落した試掘坑',
        'The flagship landing': '旗艦停泊地',
        'The greater hold': '大型格納区画',
        'The loading dock': '搬入出区画',
        'Vermilion Flame': '赤熱火',
        'Vortical Orb': '魔嵐球',
        'Waveborne Zirnitra': 'ウェイブ・ジルニトラ',
        'Hedetet': 'ヘデテト',
        'Clibanarius': 'クリバナリウス',
        'Hanbi': 'ハンビ',
        'Hrodvitnir': 'フローズヴィトニル',
        'Kampe': 'カンペ',
        'Ayida': 'アイダ',
        '(?<!Tamed )Alkonost': 'アルコノスト',
      },
      'replaceText': {
        '74 Degrees': 'ウォーターショット',
        'Advanced Death IV': '強化デスジャ',
        'Advanced Death Ray': '強化デスレイ',
        'Advanced Nox': '強化ノックス',
        'Aetheric Boom': 'エーテル波動',
        'Aetheric Explosion': 'エーテリックエクスプロージョン',
        'Aetherochemical Laser': '魔科学レーザー',
        'Ambient Pulsation': '魔脈瘤',
        'Analysis': 'アナライズ',
        'Anti-Personnel Missile': '対人ミサイル乱射',
        'Assault Cannon': 'アサルトカノン',
        'Ballistic Impact': 'ミサイル着弾',
        'Broadside Barrage': 'ボロードサイドバラージ',
        'Burgeoning Dread': '恐怖の波動',
        'Burn(?!ing)': '燃焼',
        'Burning Blade': 'バーンブレイド',
        'Deadly Dealing': 'デッドリースマッシュ',
        'Diabolic Gate': '異界の扉',
        'Double Cast': 'ダブルキャスト',
        '(?<!Aetheric )Explosion': '爆発',
        'Fell Flow': '汚濁の奔流',
        'Fire Brand': '炎帝十文字',
        'Flamedive': 'フレイムダイブ',
        'Flaming Cyclone': 'フレイムサイクロン',
        'Fleshy Necromass': '不浄圧殺',
        'Foreshadowing': 'フォアシャドウィング',
        'Frigid Pulse': 'フリジッドパルス',
        'Ghastly Aura': '喪失の波動',
        'Grand Crossflame': 'グランドクロスフレイム',
        'High-Powered Magitek Ray': '高出力魔導レーザー',
        'Hyperpyroplexy': 'ハイパー・パイロプレクシー',
        'Ignis Est': 'イグニス・エスト',
        'Immolate': '大燃焼',
        'Left Brand': 'レフトブランド',
        'Light Pseudopillar': '魔科学式リヒト・ゾイレ',
        'Magitek Bit': 'ビット射出',
        'Magitek Crossray': '魔導クロスレーザー',
        'Magitek Halo': '魔導バーニングサークル',
        'Mannatheihwon Flame': 'マントヴァフレイム',
        'Might Of Malice': '重蹴撃',
        'Missile Command': 'ミサイル全弾発射',
        'Missile Salvo': '連装ミサイル',
        'Mobile Crossray': '転移式クロスレーザー',
        'Mobile Halo': '転移式バーニングサークル',
        'Necrotic Billow': '腐朽焼殺',
        'Nihility\'s Song': 'ニヒリティソング',
        'North Wind': '北風',
        'Obey': 'しじをきく',
        'Pain Storm': 'ペインストーム',
        'Painful Gust': 'ペインフルガスト',
        'Pentagust': 'ペンタガスト',
        'Phenex': 'フェネクス',
        'Pillar Of Shamash': 'シャムスの柱',
        'Putrified Soul': '汚染波',
        'Pyrocrisis': 'パイロクライシス',
        'Pyrodoxy': 'パイロドクシー',
        'Pyrokinesis': 'パイロキネシス',
        '(?<![-r])Pyroplexy': 'パイロプレクシー',
        'Raw Heat': '爆炎波',
        'Read Orders: Field Support': '作戦指示：歩兵支援',
        'Reverse Time Eruption': 'リバース・タイムエラプション',
        'Right Brand': 'ライトブランド',
        'Ruinous Pseudomen': '魔科学式ルイナスオーメン',
        'Sanctified Quake III': 'サンクティファイド・クエイガ',
        'South Wind': '南風',
        'Spiral Scourge': 'スパイラルスカージ',
        'Stormborne Zirnitra': 'フレイム・ジルニトラ',
        'Stormcall': 'ストームコール',
        'Suppressive Magitek Rays': '全方位魔導レーザー',
        'Surface Missile': '対地ミサイル',
        'Swooping Frenzy': 'スワープフレンジー',
        'Terminus Est': 'ターミナス・エスト',
        'Thermal Gust': 'サーマルガスト',
        '(?<!Reverse )Time Eruption': 'タイムエラプション',
        'Tooth And Talon': '獣王裂爪撃',
        'Touchdown': 'タッチダウン',
        'Turbine': 'タービン',
        'Ultimate Pseudoterror': '魔科学式アルティメットテラー',
        'Void Call': '使い魔召喚',
        'Void Systems Overload': 'V機関暴走',
        'Wildfire Winds': '炎帝嵐翼破',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '4Th Legion Augur': '第四军团先知',
        '4Th Legion Blackburn': '第四军团黑色燃焰',
        '4th-Make Belias': '第四军团贝利亚斯',
        '4Th-Make Cuchulainn': '第四军团丘库雷因',
        '4th-Make Hashmal': '第四军团哈修马利姆',
        '4th-Make Shemhazai': '第四军团谢米哈扎',
        '(?<!Tamed )Alkonost': '阿尔科诺斯特',
        'Ayida': '阿依达',
        '(?<!4Th Legion )Blackburn': '黑色燃焰',
        'Clibanarius': '铠甲重骑兵',
        'Dawon The Younger': '小达温',
        'Diabolic Bit': '迪亚布罗浮游炮',
        'Dyunbu the Accursed': '污身秽心 尤恩布',
        'Flameborne Zirnitra': '火焰札尼尔查妖蛇',
        'Hanbi': '汉比',
        'Hedetet': '赫德提特',
        'Hrodvitnir': '恶名苍狼',
        'Huma': '呼玛',
        'Ice Sprite': '冰元精',
        'Ignis Est': '是为烈火',
        'Kampe': '坎珀',
        'Magitek Development': '魔导研究区',
        'Phantom Hashmal': '哈修马利姆的幻影',
        'Sartauvoir The Inferno': '铁胆狱火 萨托瓦尔',
        'Saunion': '桑尼恩',
        'Stormborne Zirnitra': '暴风札尼尔查妖蛇',
        'Tamed Alkonost(?!\'s Shadow)': '驯服阿尔科诺斯特',
        'Tamed Alkonost\'s Shadow': '驯服阿尔科诺斯特之影',
        'Tamed Carrion Crow': '驯服食腐鸦',
        'The Diablo Armament': '迪亚布罗魔兵',
        'The fallen ring': '崩塌的试掘坑',
        'The flagship landing': '旗舰停泊地',
        'The greater hold': '大型兵器仓库',
        'The loading dock': '货物装卸区',
        'Vermilion Flame': '赤热火',
        'Vortical Orb': '魔风球',
        'Waveborne Zirnitra': '波涛札尼尔查妖蛇',
      },
      'replaceText': {
        '--lasers--': '--激光--',
        '--line stack--': '--直线分摊--',
        '74 Degrees': '射水',
        'Advanced Death IV': '强化极死',
        'Advanced Death Ray': '强化死亡射线',
        'Advanced Nox': '深夜',
        'Aetheric Boom': '以太波动',
        'Aetheric Explosion': '以太爆炸',
        'Aetherochemical Laser': '魔科学激光',
        'Ambient Pulsation': '魔脉瘤',
        'Analysis': '分析',
        'Anti-Personnel Missile': '对人导弹乱射',
        'Assault Cannon': '突击加农炮',
        'Ballistic Impact': '导弹命中',
        'Broadside Barrage': '侧翼火力',
        'Burgeoning Dread': '恐惧波动',
        'Burn(?!ing)': '燃烧',
        'Burning Blade': '燃烧之刃',
        'Deadly Dealing': '致命碎击',
        'Diabolic Gate': '异界之门',
        'Double Cast': '双重咏唱',
        '(?<!Aetheric )Explosion': '爆炸',
        'Fell Flow': '污浊奔流',
        'Fire Brand': '炎帝十文字',
        'Flamedive': '烈焰俯冲',
        'Flaming Cyclone': '烈焰旋风',
        'Fleshy Necromass': '不净压杀',
        'Foreshadowing': '预示',
        'Frigid Pulse': '寒冷脉冲',
        'Ghastly Aura': '丧失波动',
        'Grand Crossflame': '大十字火',
        'High-Powered Magitek Ray': '高功率魔导激光',
        'Hyperpyroplexy': '超火卒',
        'Ignis Est': '是为烈火',
        'Immolate': '大燃烧',
        'Left Brand': '左印',
        'Light Pseudopillar': '魔科学式光柱',
        'Magitek Bit': '浮游炮射出',
        'Magitek Crossray': '魔导交叉激光',
        'Magitek Halo': '魔导焰光环',
        'Mannatheihwon Flame': '曼托瓦之炎',
        'Might Of Malice': '重踢击',
        'Missile Command': '导弹齐发',
        'Missile Salvo': '连装导弹',
        'Mobile Crossray': '移动式交叉激光',
        'Mobile Halo': '移动式焰光环',
        'Necrotic Billow': '腐朽烧杀',
        'Nihility\'s Song': '虚无之歌',
        'North Wind': '北风',
        'Obey': '服从',
        '(?<!Verd)Orb': '球',
        'Pain Storm': '痛苦风暴',
        'Painful Gust': '极痛突风',
        'Pentagust': '五向突风',
        'Phenex': '菲尼克斯',
        'Pillar Of Shamash': '太阳之柱',
        'Putrified Soul': '污染波',
        'Pyrocrisis': '火危',
        'Pyrodoxy': '火念',
        'Pyrokinesis': '火动',
        '(?<![-r])Pyroplexy': '火卒',
        'Raw Heat': '爆炎破',
        'Read Orders: Field Support': '作战指示：步兵支援',
        'Reverse Time Eruption': '时空地火喷发·逆转',
        'Right Brand': '右印',
        'Ruinous Pseudomen': '魔科学式破灭预兆',
        'Sanctified Quake III': '圣化爆震',
        'South Wind': '南风',
        'Spiral Scourge': '螺旋灾变',
        'Stormborne Zirnitra': '火焰札尼尔查妖蛇',
        'Stormcall': '呼唤风暴',
        'Suppressive Magitek Rays': '全方位魔导激光',
        'Surface Missile': '对地导弹',
        'Swooping Frenzy': '狂乱猛冲',
        'Terminus Est': '恩惠终结',
        'Thermal Gust': '炙热风',
        '(?<!Reverse )Time Eruption': '时空地火喷发',
        'Tooth And Talon': '兽王裂爪击',
        'Touchdown': '空降',
        'Turbine': '涡轮',
        'Ultimate Pseudoterror': '魔科学式究极恐惧',
        'Void Call': '虚无召唤',
        'Void Systems Overload': '虚无系统失控',
        'Wildfire Winds': '炎帝风翼破',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '4Th Legion Augur': 'IV군단 점쟁이',
        '4Th Legion Blackburn': 'IV군단 블랙번',
        '4th-Make Belias': 'IV군단 벨리아스',
        '4Th-Make Cuchulainn': 'IV군단 쿠훌린',
        '4th-Make Hashmal': 'IV군단 하쉬말림',
        '4th-Make Shemhazai': 'IV군단 셰미하자',
        '(?<!Tamed )Alkonost': '알코노스트',
        'Ayida': '아이다',
        '(?<!4Th Legion )Blackburn': '블랙번',
        'Clibanarius': '클리바나리우스',
        'Dawon The Younger': '다우언 주니어',
        'Diabolic Bit': '디아블로 비트',
        'Dyunbu the Accursed': '부정한 윤부',
        'Flameborne Zirnitra': '불꽃 지르니트라',
        'Hanbi': '한비',
        'Hedetet': '헤데테트',
        'Hrodvitnir': '흐로드비트니르',
        'Huma': '후마',
        'Ice Sprite': '얼음 정령',
        'Ignis Est': '파멸의 화염',
        'Kampe': '캄페',
        'Magitek Development': '마도 연구 구획',
        'Phantom Hashmal': '하쉬말림의 환영',
        'Sartauvoir The Inferno': '쇳불의 사르토부아르',
        'Saunion': '사우니언',
        'Stormborne Zirnitra': '폭풍 지르니트라',
        'Tamed Alkonost(?!\'s Shadow)': '길들여진 알코노스트',
        'Tamed Alkonost\'s Shadow': '길들여진 알코노스트의 그림자',
        'Tamed Carrion Crow': '길들여진 송장까마귀',
        'The Diablo Armament': '디아블로 아머먼트',
        'The fallen ring': '붕괴된 시굴갱',
        'The flagship landing': '기함 정박지',
        'The greater hold': '대형 격납 구획',
        'The loading dock': '반출입 구획',
        'Vermilion Flame': '적열염',
        'Vortical Orb': '바람 마구',
        'Waveborne Zirnitra': '파도 지르니트라',
      },
      'replaceText': {
        '--lasers--': '--레이저--',
        '--line stack--': '--직선 쉐어--',
        '74 Degrees': '물 쏘기',
        'Advanced Death IV': '강화 데스쟈',
        'Advanced Death Ray': '강화 죽음의 광선',
        'Advanced Nox': '강화 암야',
        'Aetheric Boom': '에테르 파동',
        'Aetheric Explosion': '에테르 파열',
        'Aetherochemical Laser': '마과학 레이저',
        'Ambient Pulsation': '마맥류',
        'Analysis': '분석',
        'Anti-Personnel Missile': '대인 미사일 난사',
        'Assault Cannon': '맹공포',
        'Ballistic Impact': '미사일 착탄',
        'Broadside Barrage': '전면 파동',
        'Burgeoning Dread': '공포의 파동',
        'Burn(?!ing)': '연소',
        'Burning Blade': '불타는 검',
        'Deadly Dealing': '죽음의 타격',
        'Diabolic Gate': '이계의 문',
        'Double Cast': '이중 마술',
        '(?<!Aetheric )Explosion': '폭발',
        'Fell Flow': '혼탁한 급류',
        'Fire Brand': '염제 십자',
        'Flamedive': '화염 돌진',
        'Flaming Cyclone': '불꽃 회오리',
        'Fleshy Necromass': '부정 압살',
        'Foreshadowing': '그림자 날갯짓',
        'Frigid Pulse': '냉랭한 고동',
        'Ghastly Aura': '상실의 파동',
        'Grand Crossflame': '십자 불꽃',
        'High-Powered Magitek Ray': '고출력 마도 레이저',
        'Hyperpyroplexy': '극강 불꽃 분화',
        'Ignis Est': '파멸의 화염',
        'Immolate': '대연소',
        'Left Brand': '왼쪽 불꽃검',
        'Light Pseudopillar': '마과학식 빛 기둥',
        'Magitek Bit': '비트 사출',
        'Magitek Crossray': '마도 십자 레이저',
        'Magitek Halo': '마도 원형 레이저',
        'Mannatheihwon Flame': '만토바의 불꽃',
        'Might Of Malice': '육중한 발차기',
        'Missile Command': '미사일 전탄 발사',
        'Missile Salvo': '연발 미사일',
        'Mobile Crossray': '이동식 십자 레이저',
        'Mobile Halo': '이동식 원형 레이저',
        'Necrotic Billow': '부패 소살',
        'Nihility\'s Song': '허무의 노래',
        'North Wind': '북풍',
        'Obey': '명령 따르기',
        '(?<!Verd)Orb': '구슬',
        'Pain Storm': '고통의 폭풍',
        'Painful Gust': '고통의 돌풍',
        'Pentagust': '다섯 갈래 돌풍',
        'Phenex': '페넥스',
        'Pillar Of Shamash': '샤마쉬의 기둥',
        'Putrified Soul': '오염파',
        'Pyrocrisis': '불꽃 사태',
        'Pyrodoxy': '불꽃 이론',
        'Pyrokinesis': '불꽃 염동력',
        '(?<![-r])Pyroplexy': '불꽃 분화',
        'Raw Heat': '폭염파',
        'Read Orders: Field Support': '작전 지시: 보병 지원',
        'Reverse Time Eruption': '뒤바뀐 시간의 불기둥',
        'Right Brand': '오른쪽 불꽃검',
        'Ruinous Pseudomen': '마과학식 재앙의 전조',
        'Sanctified Quake III': '축성의 퀘이가',
        'South Wind': '남풍',
        'Spiral Scourge': '회전 채찍질',
        'Stormborne Zirnitra': '폭풍 지르니트라',
        'Stormcall': '폭풍 부르기',
        'Suppressive Magitek Rays': '전방위 마도 레이저',
        'Surface Missile': '대지 미사일',
        'Swooping Frenzy': '광란의 급강하',
        'Terminus Est': '파멸의 종착역',
        'Thermal Gust': '뜨거운 돌풍',
        '(?<!Reverse )Time Eruption': '시간의 불기둥',
        'Tooth And Talon': '마수왕 열조격',
        'Touchdown': '착지',
        'Turbine': '터빈',
        'Ultimate Pseudoterror': '마과학식 궁극의 공포',
        'Void Call': '사역마 소환',
        'Void Systems Overload': 'V기관 폭주',
        'Wildfire Winds': '염제 남익파',
      },
    },
  ],
});
