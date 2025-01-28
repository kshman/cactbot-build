import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO:
//  - Beat 1: Track player hearts and only fire `Headmarker Party Stacks` based on <=2 hearts?
//     - Related: Perhaps call 'Don't stack' if player has 3 hearts?

export interface Data extends RaidbossData {
  partnersSpreadCounter: number;
  storedPartnersSpread?: 'partners' | 'spread';
  beat?: 1 | 2 | 3;
  tankLaserCollect: string[];
  poisonDebuff?: 'short' | 'long';
  beelovedDebuffs: {
    alpha: string[];
    beta: string[];
  };
  beelovedType?: 'alpha' | 'beta';
  //
  myHearts: number;
  heartShed: string[];
  poisonPop?: number;
}

const headMarkerData = {
  // Vfx Path: lockon6_t0t
  spreadMarker1: '00EA',
  // Vfx Path: m0676trg_tw_d0t1p
  sharedBuster: '0103',
  // Vfx Path: tank_laser_5sec_lockon_c0a1
  tankLaser: '01D7',
  // Vfx Path: m0906_tgae_s701k2
  spreadMarker2: '0203',
  // Vfx Path: m0906_share4_7s0k2
  heartStackMarker: '0205',
} as const;

const poisonOutputStrings = {
  defamationOnYou: Outputs.defamationOnYou,
  defamations: {
    en: 'Defamations',
    ja: '自分に巨大な爆発',
    ko: '대폭발! 바깥으로',
  },
  in: {
    en: 'In (Avoid Defamations)',
    ja: '中央へ (巨大な爆発を避けて)',
    ko: '한가운데 (곧 타워)',
  },
};

const beelovedDebuffDurationOrder = [12, 28, 44, 62];

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM2Savage',
  zoneId: ZoneId.AacLightHeavyweightM2Savage,
  timelineFile: 'r2s.txt',
  initData: () => ({
    partnersSpreadCounter: 0,
    tankLaserCollect: [],
    beelovedDebuffs: {
      alpha: Array(4).map(() => ''),
      beta: Array(4).map(() => ''),
    },
    myHearts: 0,
    heartShed: [],
  }),
  triggers: [
    {
      id: 'R2S Beat Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['9C24', '9C25', '9C26'], capture: true },
      run: (data, matches) => {
        if (matches.id === '9C24')
          data.beat = 1;
        else if (matches.id === '9C25')
          data.beat = 2;
        else
          data.beat = 3;
        data.heartShed = [];
      },
    },
    {
      id: 'R2S Headmarker Shared Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.sharedBuster, capture: true },
      suppressSeconds: 5,
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R2S Headmarker Cone Tankbuster Collect',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.tankLaser, capture: true },
      run: (data, matches) => data.tankLaserCollect.push(matches.target),
    },
    {
      id: 'R2S Headmarker Cone Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.tankLaser, capture: false },
      delaySeconds: 0.1,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.tankLaserCollect.includes(data.me))
          return output.cleaveOnYou!();
        if (!data.options.AutumnOnly)
          return output.avoidCleave!();
      },
      run: (data) => data.tankLaserCollect = [],
      outputStrings: {
        cleaveOnYou: Outputs.tankCleaveOnYou,
        avoidCleave: Outputs.avoidTankCleave,
      },
    },
    {
      id: 'R2S Headmarker Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker2, capture: true },
      condition: (data, matches) => {
        if (data.myHearts !== 1)
          return false;
        data.heartShed.push(matches.target);
        return data.heartShed.length === 2;
      },
      infoText: (data, _matches, output) => {
        const dps = data.party.isDPS(data.me);
        if (data.heartShed.includes(data.me))
          return dps ? output.bairDps!() : output.baitTh!();
        return dps ? output.towerDps!() : output.towerTh!();
      },
      run: (data) => data.heartShed = [],
      outputStrings: {
        baitTh: {
          en: 'Drop west',
          ko: '서쪽 바깥에 장판 버려요!',
        },
        bairDps: {
          en: 'Drop east',
          ko: '동쪽 바깥에 장판 버려요!',
        },
        towerTh: {
          en: 'N/W tower',
          ko: '북/서 타워 밟아요',
        },
        towerDps: {
          en: 'S/E tower',
          ko: '남/동 타워 밟아요',
        },
      },
    },
    {
      id: 'R2S Headmarker Alarm Pheromones Puddle',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker1, capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Drop Puddle Outside',
          ja: '外側に捨てて',
          ko: '바깥에 장판 버려요!',
        },
      },
    },
    {
      id: 'R2S Headmarker Party Stacks',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.heartStackMarker, capture: true },
      condition: (data, matches) => {
        if (data.beat === 1)
          return true;
        if (data.beat === 2 && data.myHearts === 0) {
          data.heartShed.push(matches.target);
          return data.heartShed.length === 2;
        }
        return false;
      },
      infoText: (data, matches, output) => {
        if (data.beat === 1) {
          const target = data.party.member(matches.target);
          return output.stacks1!({ target: target.nick });
        }
        if (data.beat === 2 && data.heartShed.length === 2) {
          const target1 = data.party.member(data.heartShed[0]);
          const target2 = data.party.member(data.heartShed[1]);
          return output.stacks2!({ target1: target1.nick, target2: target2.nick });
        }
      },
      run: (data) => data.heartShed = [],
      outputStrings: {
        stacks1: {
          en: 'Stacks: ${target}',
          ko: '뭉쳐요: ${target}',
        },
        stacks2: {
          en: 'Stacks: ${target1}/${target2}',
          ko: '뭉쳐요: ${target1}/${target2}',
        },
      },
    },
    {
      id: 'R2S Call Me Honey',
      type: 'StartsUsing',
      netRegex: { id: '9183', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Partners/Spread Counter',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9185', '9B08', '9B09'], source: 'Honey B. Lovely', capture: false },
      run: (data) => data.partnersSpreadCounter++,
    },
    {
      id: 'R2S Drop of Venom/Love',
      type: 'StartsUsing',
      netRegex: { id: ['9185', '9B09'], source: 'Honey B. Lovely', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.storedPartnersSpread = 'partners',
      outputStrings: {
        text: {
          en: 'Stored: Partners',
          ja: 'あとでペア',
          ko: '(나중에 둘이 페어)',
        },
      },
    },
    {
      id: 'R2S Splash of Venom/Love',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9B08'], source: 'Honey B. Lovely', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.storedPartnersSpread = 'spread',
      outputStrings: {
        text: {
          en: 'Stored: Spread',
          ja: 'あとで散開',
          ko: '(나중에 흩어져요)',
        },
      },
    },
    {
      id: 'R2S Honey Beeline Initial',
      type: 'StartsUsing',
      netRegex: { id: ['9186', '9B0C'], source: 'Honey B. Lovely', capture: false },
      response: Responses.goSides(), // default is alertText, no need to specify
    },
    {
      id: 'R2S Honey Beeline After Reminder',
      type: 'StartsUsing',
      netRegex: { id: ['9186', '9B0C'], source: 'Honey B. Lovely', capture: false },
      delaySeconds: 1.5, // add a short delay to avoid overlapping alerts
      infoText: (data, _matches, output) => {
        const mech = data.storedPartnersSpread;
        return mech === undefined ? output.middle!() : output[mech]!();
      },
      outputStrings: {
        middle: {
          en: '(middle after)',
          ja: '(後で内側へ)',
          ko: '(나중에 가운데로)',
        },
        partners: {
          en: '(middle + partners after)',
          ja: '(後で内側へ + ペア)',
          ko: '(나중에 가운데 + 둘이)',
        },
        spread: {
          en: '(middle + spread after)',
          ja: '(後で内側へ + 散開)',
          ko: '(나중에 가운데 + 흩어져요)',
        },
      },
    },
    {
      id: 'R2S Honey Beeline Followup',
      type: 'Ability',
      netRegex: { id: ['9186', '9B0C'], source: 'Honey B. Lovely', capture: false },
      alertText: (data, _matches, output) => {
        const mech = data.storedPartnersSpread;
        const outStr = mech === undefined
          ? output.middle!()
          : output.combo!({ next: output.middle!(), mech: output[mech]!() });
        return outStr;
      },
      outputStrings: {
        middle: Outputs.middle,
        spread: {
          en: 'Spread',
          ja: '散開',
          ko: '흩어져요',
        },
        partners: {
          en: 'Partners',
          ja: 'ペア',
          ko: '둘이 함께',
        },
        combo: {
          en: '${next} + ${mech}',
          ja: '${next} + ${mech}',
          ko: '${next} + ${mech}',
        },
      },
    },
    {
      id: 'R2S Tempting Twist Initial',
      type: 'StartsUsing',
      netRegex: { id: ['9187', '9B0D'], source: 'Honey B. Lovely', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'R2S Tempting Twist After Reminder',
      type: 'StartsUsing',
      netRegex: { id: ['9187', '9B0D'], source: 'Honey B. Lovely', capture: false },
      delaySeconds: 1.5, // add a short delay to avoid overlapping alerts
      infoText: (data, _matches, output) => {
        const mech = data.storedPartnersSpread;
        return mech === undefined ? output.out!() : output[mech]!();
      },
      outputStrings: {
        out: {
          en: '(out after)',
          ja: '(後で外側へ)',
          ko: '(나중에 바깥으로)',
        },
        partners: {
          en: '(out + partners after)',
          ja: '(後で外側へ + ペア)',
          ko: '(나중에 바깥 + 둘이)',
        },
        spread: {
          en: '(out + spread after)',
          ja: '(後で外側へ + 散開)',
          ko: '(나중에 바깥 + 흩어져요)',
        },
      },
    },
    {
      id: 'R2S Tempting Twist Followup',
      type: 'Ability',
      netRegex: { id: ['9187', '9B0D'], source: 'Honey B. Lovely', capture: false },
      alertText: (data, _matches, output) => {
        const mech = data.storedPartnersSpread;
        const outStr = mech === undefined
          ? output.out!()
          : output.combo!({ next: output.out!(), mech: output[mech]!() });
        return outStr;
      },
      outputStrings: {
        out: Outputs.out,
        spread: {
          en: 'Spread',
          ja: '散開',
          ko: '흩어져요',
        },
        partners: {
          en: 'Partners',
          ja: 'ペア',
          ko: '둘이 페어',
        },
        combo: {
          en: '${next} + ${mech}',
          ja: '${next} + ${mech}',
          ko: '${next} + ${mech}',
        },
      },
    },
    {
      id: 'R2S Honey B. Live Beats',
      type: 'StartsUsing',
      netRegex: { id: ['9C24', '9C25', '9C26'], source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Loveseeker',
      type: 'StartsUsing',
      netRegex: { id: '9B7D', source: 'Honey B. Lovely', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'R2S Centerstage Combo',
      type: 'StartsUsing',
      netRegex: { id: '91AC', source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notAutumnOnly(),
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Under Intercards => Out => Cards',
          ja: '斜め内側 => 外側 => 十字',
          ko: '밑❌ 🔜 바깥❌ 🔜 바깥➕',
        },
      },
    },
    {
      id: 'R2S Outerstage Combo',
      type: 'StartsUsing',
      netRegex: { id: '91AD', source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notAutumnOnly(),
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out Cards => Intercards => Under',
          ja: '外十字 => 外斜め => 内側',
          ko: '바깥➕ 🔜 바깥❌ 🔜 밑❌',
        },
      },
    },
    {
      id: 'R2S Poison Debuff Tracker',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5E' },
      condition: Conditions.targetIsYou(),
      // short debuffs are 26s, longs are 46s
      run: (data, matches) =>
        data.poisonDebuff = parseFloat(matches.duration) > 30 ? 'long' : 'short',
    },
    {
      id: 'R2S Poison First Defamations',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5E', capture: false },
      delaySeconds: 20, // 6 sec. before expiration
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.poisonDebuff === undefined)
          return output.defamations!();
        return data.poisonDebuff === 'short' ? output.defamationOnYou!() : output.in!();
      },
      outputStrings: poisonOutputStrings,
    },
    {
      id: 'R2S Poison Second Defamations',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5E', capture: false },
      delaySeconds: 40, // 6 sec. before expiration
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.poisonDebuff === undefined)
          return output.defamations!();
        return data.poisonDebuff === 'short' ? output.in!() : output.defamationOnYou!();
      },
      outputStrings: poisonOutputStrings,
    },
    {
      id: 'R2S Poison Towers',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5E' },
      // use condition instead of suppress to prevent race condition with Poison Debuff Tracker
      condition: Conditions.targetIsYou(),
      // delay until the opposite (short/long) debuff resolves
      delaySeconds: (data) => data.poisonDebuff === 'long' ? 26 : 46,
      alertText: (data, _matches, output) => {
        // if no poison debuff, there really can't be an accurate call anyway
        if (data.poisonDebuff !== undefined)
          return output.towers!();
      },
      outputStrings: {
        towers: Outputs.getTowers,
      },
    },
    {
      id: 'R2S Honey B. Finale',
      type: 'StartsUsing',
      netRegex: { id: '918F', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Rotten Heart',
      type: 'StartsUsing',
      netRegex: { id: '91AA', source: 'Honey B. Lovely', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R2S Beeloved Venom Tracker',
      type: 'GainsEffect',
      // F5C: Alpha, F5D: Beta
      // durations are 12s, 28s, 44s, and 62s
      netRegex: { effectId: ['F5C', 'F5D'] },
      run: (data, matches) => {
        const type = matches.effectId === 'F5C' ? 'alpha' : 'beta';
        if (data.me === matches.target)
          data.beelovedType = type;

        const duration = parseFloat(matches.duration);
        const orderIdx = beelovedDebuffDurationOrder.indexOf(duration);
        if (orderIdx === -1) // should not happen
          return;
        data.beelovedDebuffs[type][orderIdx] = matches.target;
      },
    },
    {
      id: 'R2S Beeloved Venom Player Merge',
      type: 'GainsEffect',
      netRegex: { effectId: ['F5C', 'F5D'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      alertText: (data, _matches, output) => {
        let partner = output.unknown!();
        const myType = data.beelovedType;
        if (myType === undefined)
          return output.merge!({ player: partner });

        const orderIdx = data.beelovedDebuffs[myType].indexOf(data.me);
        if (orderIdx === -1)
          return output.merge!({ player: partner });

        const partnerType = myType === 'alpha' ? 'beta' : 'alpha';
        partner = data.party.member(data.beelovedDebuffs[partnerType][orderIdx]).nick ??
          output.unknown!();
        return output.merge!({ player: partner });
      },
      outputStrings: {
        merge: {
          en: 'Merge Soon w/ ${player}',
          ja: '${player} と重なって',
          ko: '문대요: ${player}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R2S Beeloved Venom Other Merge',
      type: 'GainsEffect',
      // only fire on the Alpha debuffs so the trigger fires once per merge
      netRegex: { effectId: 'F5C' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      infoText: (data, matches, output) => {
        const duration = parseFloat(matches.duration);
        const orderIdx = beelovedDebuffDurationOrder.indexOf(duration);
        if (orderIdx === -1) // should not happen
          return;

        const alpha = data.beelovedDebuffs.alpha[orderIdx] ?? output.unknown!();
        const beta = data.beelovedDebuffs.beta[orderIdx] ?? output.unknown!();

        // no alert if we're one of the players; that's handled by Player Merge
        if (alpha === data.me || beta === data.me)
          return;

        const alphaShort = data.party.member(alpha).nick ?? output.unknown!();
        const betaShort = data.party.member(beta).nick ?? output.unknown!();
        return output.merge!({ alpha: alphaShort, beta: betaShort });
      },
      outputStrings: {
        merge: {
          en: 'Merge: ${alpha} + ${beta}',
          ja: '組み合わせ: ${alpha} + ${beta}',
          ko: '문댈 차례: ${alpha} + ${beta}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R2S no Heart',
      type: 'GainsEffect',
      netRegex: { effectId: 'F52' },
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, _matches, output) => {
        if (data.beat === 2)
          return output.live2!();
      },
      run: (data) => data.myHearts = 0,
      outputStrings: {
        live2: {
          en: 'Bait AOE',
          ko: '한가운데로 🔜 장판 유도',
        },
      },
    },
    {
      id: 'R2S Infatuated Heart',
      type: 'GainsEffect',
      netRegex: { effectId: 'F53' },
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, _matches, output) => {
        if (data.beat === 2)
          return output.live2!();
      },
      run: (data) => data.myHearts = 1,
      outputStrings: {
        live2: {
          en: 'Tower or bait AOE',
          ko: '남쪽으로 🔜 타워 또는 장판',
        },
      },
    },
    {
      id: 'R2S Head Over Heels Heart',
      type: 'GainsEffect',
      netRegex: { effectId: 'F54' },
      condition: (data, matches) => data.me === matches.target,
      run: (data) => data.myHearts = 2,
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Honey B. Lovely': 'Suzie Summ Honigsüß',
        'Sweetheart': 'honigsüß(?:e|er|es|en) Herz',
      },
      'replaceText': {
        'Alarm Pheromones': 'Alarmpheromon',
        'Bee Sting': 'Bienenstich',
        'Big Burst': 'Detonation',
        'Blinding Love': 'Blinde Liebe',
        'Call Me Honey': 'Lieblicher Ruf',
        'Centerstage Combo': 'Innere Bühnenkombination',
        'Drop of Love': 'Liebestropfen',
        'Drop of Venom': 'Gifttropfen',
        'Fracture': 'Sprengung',
        'Heart-Struck': 'Herzschock',
        'Heartsick': 'Herzschmerz',
        'Heartsore': 'Herzqual',
        'Honey B. Finale': 'Honigsüßes Finale',
        'Honey B. Live: 1st Beat': 'Suzie Summ Solo: Auftakt',
        'Honey B. Live: 2nd Beat': 'Suzie Summ Solo: Refrain',
        'Honey B. Live: 3rd Beat': 'Suzie Summ Solo: Zugabe',
        'Honey Beeline': 'Honigschuss',
        'Killer Sting': 'Tödlicher Stich',
        'Laceration': 'Zerreißen',
        'Love Me Tender': 'Ein bisschen Liebe',
        'Loveseeker': 'Umwerben',
        'Outerstage Combo': 'Äußere Bühnenkombination',
        'Poison Sting': 'Giftstachel',
        'Rotten Heart': 'Schwarzes Herz',
        'Sheer Heart Attack': 'Herz ist Trumpf',
        'Splash of Venom': 'Giftregen',
        'Splinter': 'Platzen',
        'Spread Love': 'Liebesregen',
        'Stinging Slash': 'Tödlicher Schnitt',
        'Tempting Twist': 'Honigdreher',
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(drop\\)': '(Tropfen)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(stun for': '(Betäubung für',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Honey B. Lovely': 'Honey B. Lovely',
        'Sweetheart': 'Cœur chaleureux',
      },
      'replaceText': {
        'Alarm Pheromones': 'Phéromones d\'alerte',
        'Bee Sting': 'Dard d\'abeille',
        'Big Burst': 'Grosse explosion',
        'Blinding Love': 'Amour aveuglant',
        'Call Me Honey': 'Appelez-moi Lovely',
        'Centerstage Combo': 'Combo d\'amour central',
        'Drop of Love': 'Gouttes d\'amour',
        'Drop of Venom': 'Chute de venin',
        'Fracture': 'Fracture',
        'Heart-Struck': 'Choc de cœur',
        'Heartsick': 'Mal de cœur',
        'Heartsore': 'Peine de cœur',
        'Honey B. Finale': 'Honey B. Final',
        'Honey B. Live: 1st Beat': 'Honey B. Live - Ouverture',
        'Honey B. Live: 2nd Beat': 'Honey B. Live - Spectacle',
        'Honey B. Live: 3rd Beat': 'Honey B. Live - Conclusion',
        'Honey Beeline': 'Rayon mielleux',
        'Killer Sting': 'Dard tueur',
        'Laceration': 'Lacération',
        'Love Me Tender': 'Effusion d\'amour',
        'Loveseeker': 'Amour persistant',
        'Outerstage Combo': 'Combo d\'amour extérieur',
        'Poison Sting': 'Dard empoisonné',
        'Rotten Heart': 'Cœur cruel',
        'Sheer Heart Attack': 'Attaque au cœur pur',
        'Splash of Venom': 'Pluie de venin',
        'Splinter': 'Rupture',
        'Spread Love': 'Pluie d\'amour',
        'Stinging Slash': 'Taillade tueuse',
        'Tempting Twist': 'Tourbillon tentateur',
        '\\(cast\\)': '(Incante)',
        '\\(damage\\)': '(Dommage)',
        '\\(drop\\)': '(Goutte)',
        '\\(enrage\\)': '(Enrage)',
        '\\(stun for': '(Étourdi pour',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Honey B. Lovely': 'ハニー・B・ラブリー',
        'Sweetheart': 'ラブリーハート',
      },
      'replaceText': {
        'Alarm Pheromones': 'アラームフェロモン',
        'Bee Sting': 'ビースティング',
        'Big Burst': '大爆発',
        'Blinding Love': 'ラブ・イズ・ブラインド',
        'Call Me Honey': 'ラブリーコール',
        'Centerstage Combo': 'リング・ラブコンビネーション',
        'Drop of Love': 'ラブドロップ',
        'Drop of Venom': 'ベノムドロップ',
        'Fracture': '炸裂',
        'Heart-Struck': 'ハートショック',
        'Heartsick': 'ハートシック',
        'Heartsore': 'ハートソゥ',
        'Honey B. Finale': 'ハニー・B・フィナーレ',
        'Honey B. Live: 1st Beat': 'ハニー・B・ライヴ【1st】',
        'Honey B. Live: 2nd Beat': 'ハニー・B・ライヴ【2nd】',
        'Honey B. Live: 3rd Beat': 'ハニー・B・ライヴ【3rd】',
        'Honey Beeline': 'ハニーブラスト',
        'Killer Sting': 'キラースティング',
        'Laceration': '斬撃',
        'Love Me Tender': 'ラブ・ミー・テンダー',
        'Loveseeker': 'ラブシーカー',
        'Outerstage Combo': 'ラウンド・ラブコンビネーション',
        'Poison Sting': 'ポイズンスティング',
        'Rotten Heart': 'ブラックハート',
        'Sheer Heart Attack': 'シアー・ハート・アタック',
        'Splash of Venom': 'ベノムレイン',
        'Splinter': '破裂',
        'Spread Love': 'ラブレイン',
        'Stinging Slash': 'キラースラッシュ',
        'Tempting Twist': 'ハニーツイスター',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Honey B. Lovely': '蜂蜂小甜心',
        'Sweetheart': '甜甜的心',
      },
      'replaceText': {
        'Alarm Pheromones': '告警信息素',
        'Bee Sting': '小蜂刺',
        'Big Burst': '大爆炸',
        'Blinding Love': '盲目的爱',
        'Call Me Honey': '甜言蜜语',
        'Centerstage Combo': '环环心连心',
        'Drop of Love': '爱之滴',
        'Drop of Venom': '毒液滴落',
        'Fracture': '炸裂',
        'Heart-Struck': '心震',
        'Heartsick': '心病',
        'Heartsore': '心伤',
        'Honey B. Finale': '蜂蜂落幕曲',
        'Honey B. Live: 1st Beat': '蜂蜂演唱会【首演】',
        'Honey B. Live: 2nd Beat': '蜂蜂演唱会【再演】',
        'Honey B. Live: 3rd Beat': '蜂蜂演唱会【三演】',
        'Honey Beeline': '甜心烈风',
        'Killer Sting': '杀人针',
        'Laceration': '斩击',
        'Love Me Tender': '温柔地爱我',
        'Loveseeker': '求爱',
        'Outerstage Combo': '圆圆心连心',
        'Poison Sting': '毒针',
        'Rotten Heart': '黑心',
        'Sheer Heart Attack': '骤然心痛',
        'Splash of Venom': '毒液雨',
        'Splinter': '碎裂',
        'Spread Love': '爱之雨',
        'Stinging Slash': '杀人斩',
        'Tempting Twist': '甜心旋风',
        '\\(cast\\)': '(咏唱)',
        '\\(damage\\)': '(伤害)',
        '\\(drop\\)': '(放圈)',
        '\\(enrage\\)': '(狂暴)',
        '\\(stun for': '(眩晕',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Honey B. Lovely': '허니 B. 러블리',
        'Sweetheart': '러블리 하트',
      },
      'replaceText': {
        'Alarm Pheromones': '페로몬 경보',
        'Bee Sting': '벌침',
        'Big Burst': '대폭발',
        'Blinding Love': '맹목적인 사랑',
        'Call Me Honey': '러블리한 인사',
        'Centerstage Combo': '사랑의 연격: 외측',
        'Drop of Love': '사랑 방울',
        'Drop of Venom': '독성 빗방울',
        'Fracture': '작렬',
        'Heart-Struck': '애통',
        'Heartsick': '가슴앓이',
        'Heartsore': '상심',
        'Honey B. Finale': '허니 B. 피날레',
        'Honey B. Live: 1st Beat': '허니 B. 라이브: 개막',
        'Honey B. Live: 2nd Beat': '허니 B. 라이브: 절정',
        'Honey B. Live: 3rd Beat': '허니 B. 라이브: 앙코르',
        'Honey Beeline': '허니 폭발',
        'Killer Sting': '살인 벌침',
        'Laceration': '참격',
        'Love Me Tender': '러브 미 텐더',
        'Loveseeker': '구애',
        'Outerstage Combo': '사랑의 연격: 내측',
        'Poison Sting': '독침 찌르기',
        'Rotten Heart': '흑심',
        'Sheer Heart Attack': '심쿵사',
        'Splash of Venom': '독성 비',
        'Splinter': '파열',
        'Spread Love': '사랑비',
        'Stinging Slash': '살인 참격',
        'Tempting Twist': '허니 회오리',
        '\\(cast\\)': '(시전)',
        '\\(damage\\)': '(피해)',
        '\\(drop\\)': '(장판)',
        '\\(enrage\\)': '(전멸기)',
        '\\(stun for': '(기절',
      },
    },
  ],
};

export default triggerSet;
