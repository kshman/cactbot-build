import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  seenDischarger?: boolean;
  isFinalOmega?: boolean;
  dpsShortStack?: boolean;
  helloDebuffs?: { [name: string]: string };
  archiveMarkers?: { [name: string]: string };
  calledHelloNoMarker?: boolean;
  armValue?: number;
  numArms?: number;
  beyondDefenseVuln?: string[];
  weaponPhase?: string;
  solarRayTargets?: string[];
  seenSolarRay?: boolean;
}

// O12S - Alphascape 4.0 Savage

// TODO: targetable lines in timeline

const triggerSet: TriggerSet<Data> = {
  id: 'AlphascapeV40Savage',
  zoneId: ZoneId.AlphascapeV40Savage,
  timelineFile: 'o12s.txt',
  timelineTriggers: [
    {
      id: 'O12S Discharger',
      regex: /Discharger/,
      beforeSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.seenDischarger)
          return output.knockbackAndAvoid!();
        return output.knockback!();
      },
      run: (data) => data.seenDischarger = true,
      outputStrings: {
        knockback: Outputs.knockback,
        knockbackAndAvoid: {
          en: 'Knockback F + Avoid M',
          ja: 'Fのノックバック + Mに避ける',
          ko: 'F쪽에서 넉백, M 피하기',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'O12S Ion Efflux Phase Reset',
      type: 'StartsUsing',
      netRegex: { id: '3357', source: 'Omega', capture: false },
      run: (data) => {
        data.isFinalOmega = true;

        data.dpsShortStack = true;
        data.helloDebuffs = {};
        data.calledHelloNoMarker = false;
        data.archiveMarkers = {};
        data.armValue = 0;
        data.numArms = 0;
      },
    },
    {
      id: 'O12S Beyond Defense Spread',
      type: 'StartsUsing',
      netRegex: { id: '332C', source: 'Omega-M', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'O12S Beyond Defense Vuln',
      type: 'Ability',
      netRegex: { id: '332C', source: 'Omega-M' },
      alarmText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text!();
      },
      run: (data, matches) => {
        data.beyondDefenseVuln ??= [];
        data.beyondDefenseVuln.push(matches.target);
      },
      outputStrings: {
        text: {
          en: 'Don\'t Stack!',
          ja: 'スタックするな！',
          ko: '쉐어 맞지 말것',
        },
      },
    },
    {
      id: 'O12S Beyond Defense Stack',
      type: 'Ability',
      netRegex: { id: '332C', source: 'Omega-M', capture: false },
      delaySeconds: 0.5,
      // Sometimes multiple people get hit.
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.beyondDefenseVuln && !data.beyondDefenseVuln.includes(data.me))
          return output.text!();
      },
      run: (data) => delete data.beyondDefenseVuln,
      outputStrings: {
        text: Outputs.stackMarker,
      },
    },
    {
      id: 'O12S Superliminal Motion Initial',
      type: 'StartsUsing',
      netRegex: { id: '3334', source: 'Omega-M', capture: false },
      // This is also used during the Blades phase.
      condition: (data) => data.weaponPhase !== 'blades',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Behind => Spread',
          ja: '後ろ -> 散開',
          ko: '뒤 🔜 산개',
        },
      },
    },
    {
      id: 'O12S Laser Shower',
      type: 'StartsUsing',
      netRegex: { id: '3352', source: 'Omega-M', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'O12S Cosmo Memory',
      type: 'StartsUsing',
      netRegex: { id: '3342', source: 'Omega-M', capture: false },
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'O12S Local Resonance',
      type: 'GainsEffect',
      netRegex: { target: 'Omega', effectId: '67E', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move Bosses Apart',
          ja: 'ボスを離して',
          ko: '보스 떨어뜨리기',
        },
      },
    },
    {
      id: 'O12S Remote Resonance',
      type: 'GainsEffect',
      netRegex: { target: 'Omega', effectId: '67F', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move Bosses Together',
          ja: 'ボスを重ねて',
          ko: '보스 붙이기',
        },
      },
    },
    {
      id: 'O12S Solar Ray Collect',
      type: 'StartsUsing',
      netRegex: { id: ['3350', '3351'], source: ['Omega', 'Omega-M'] },
      run: (data, matches) => {
        data.solarRayTargets ??= [];
        data.solarRayTargets.push(matches.target);
        data.seenSolarRay = true;
      },
    },
    {
      id: 'O12S Solar Ray',
      type: 'StartsUsing',
      netRegex: { id: ['3350', '3351'], source: ['Omega', 'Omega-M'] },
      suppressSeconds: 1,
      response: Responses.tankBuster(),
    },
    {
      id: 'O12S Solar Ray Not You',
      type: 'StartsUsing',
      netRegex: { id: ['3350', '3351'], source: ['Omega', 'Omega-M'], capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.solarRayTargets && !data.solarRayTargets.includes(data.me))
          return output.text!();
      },
      run: (data) => delete data.solarRayTargets,
      outputStrings: {
        text: Outputs.avoidTankCleave,
      },
    },
    {
      id: 'O12S Shield Blades Setup',
      type: 'Ability',
      netRegex: { id: ['3350', '3351'], source: ['Omega', 'Omega-M'], capture: false },
      condition: (data) => data.role === 'tank' || data.job === 'BLU',
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => delete data.weaponPhase,
      outputStrings: {
        text: {
          en: 'Bring Bosses Middle, Face Eye',
          ja: 'ボスを中央に、目を見る',
          ko: '보스들 중앙으로 데려오고, 눈쪽 보기',
        },
      },
    },
    {
      id: 'O12S Synthetic Blades',
      type: 'StartsUsing',
      netRegex: { id: '3301', source: 'Omega', capture: false },
      condition: (data) => data.seenSolarRay,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.weaponPhase = 'blades',
      outputStrings: {
        text: {
          en: 'Get Middle (Blades)',
          ja: '中へ (剣)',
          ko: '중앙으로 (검)',
        },
      },
    },
    {
      id: 'O12S Blades Superliminal Steel',
      type: 'Ability',
      netRegex: { id: '332F', source: 'Omega', capture: false },
      condition: (data) => data.weaponPhase === 'blades',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Intercards + Stack',
          ja: '斜め + 頭割り',
          ko: '대각선 + 쉐어',
        },
      },
    },
    {
      id: 'O12S Blades Superliminal Motion',
      type: 'StartsUsing',
      netRegex: { id: '3334', source: 'Omega', capture: false },
      condition: (data) => data.weaponPhase === 'blades',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Behind => Out + Spread',
          ja: '後ろ => 外へ + 散開',
          ko: '뒤 🔜 밖으로 + 산개',
        },
      },
    },
    {
      id: 'O12S Synthetic Shield',
      type: 'StartsUsing',
      netRegex: { id: '32FD', source: 'Omega-M', capture: false },
      condition: (data) => data.seenSolarRay,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.weaponPhase = 'shield',
      outputStrings: {
        text: {
          en: 'Intercards + Spread (Shield)',
          ja: '斜め + 散開 (盾)',
          ko: '대각선 + 산개 (방패)',
        },
      },
    },
    {
      id: 'O12S Shield Beyond Strength',
      type: 'Ability',
      // Warn on Pile Pitch damage for Beyond Strength before it starts casting
      netRegex: { id: '332E', source: 'Omega-M', capture: false },
      condition: (data) => data.weaponPhase === 'shield',
      // No castbar, this is the stack damage.
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread => Follow M',
          ja: '散開 -> Mを追う',
          ko: '산개 🔜 M 따라가기',
        },
      },
    },
    {
      id: 'O12S Shield Beyond Defense',
      type: 'Ability',
      // Warn on Beyond Strength ability for uncasted Efficient Bladework.
      netRegex: { id: '3328', source: 'Omega-M', capture: false },
      condition: (data) => data.weaponPhase === 'shield',
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away from M',
          ja: 'Mから離れる',
          ko: 'M으로부터 멀어지기',
        },
      },
    },
    {
      id: 'O12S Optimized Blade Dance',
      type: 'StartsUsing',
      netRegex: { id: ['334B', '334C'], source: ['Omega', 'Omega-M'] },
      suppressSeconds: 1,
      response: Responses.tankBuster(),
    },
    {
      id: 'O12S Electric Slide Marker',
      type: 'HeadMarker',
      netRegex: { id: '009[12345678]' },
      condition: Conditions.targetIsYou(),
      response: (_data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          square: {
            en: '#${num} Square',
            ja: '#${num} 四角',
            ko: '#${num} 짝수',
          },
          triangle: {
            en: '#${num} Triangle',
            ja: '#${num} 三角',
            ko: '#${num} 홀수',
          },
        };

        const id = matches.id;
        if (!id)
          return;

        let num = parseInt(id);
        const isTriangle = num >= 95;
        num -= 90;
        if (isTriangle)
          num -= 4;

        // Odd numbers have to run to the other side, so make this louder.
        // TODO: should this be alarm/alert instead of alert/info?
        const isOdd = num % 2;
        const text = isTriangle ? output.triangle!({ num: num }) : output.square!({ num: num });
        return { [isOdd ? 'alertText' : 'infoText']: text };
      },
    },
    {
      id: 'O12S MF Stack Marker',
      type: 'HeadMarker',
      netRegex: { id: '003E', capture: false },
      condition: (data) => !data.isFinalOmega,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack Groups',
          ja: '組み分け頭割り',
          ko: '그룹별 쉐어',
        },
      },
    },
    {
      id: 'O12S Optimized Meteor',
      type: 'HeadMarker',
      netRegex: { id: '0057' },
      condition: Conditions.targetIsYou(),
      response: Responses.meteorOnYou(),
    },
    {
      id: 'O12S Optimized Sagittarius Arrow',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Arrow on YOU',
          ja: '自分にアロー',
          ko: '나에게 화살징',
        },
      },
    },
    {
      id: 'O12S Packet Filter F',
      type: 'GainsEffect',
      netRegex: { effectId: '67D' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Attack Omega-M',
          ja: 'Mを攻撃',
          ko: '오메가 M 공격',
        },
      },
    },
    {
      id: 'O12S Packet Filter M',
      type: 'GainsEffect',
      netRegex: { effectId: '67C' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Attack Omega-F',
          ja: 'Fを攻撃',
          ko: '오메가 F 공격',
        },
      },
    },
    {
      id: 'O12S Diffuse Wave Cannon Sides',
      type: 'StartsUsing',
      netRegex: { id: '3367', source: 'Omega', capture: false },
      response: Responses.goSides('info'),
    },
    {
      id: 'O12S Diffuse Wave Cannon Front/Back',
      type: 'StartsUsing',
      netRegex: { id: '3368', source: 'Omega', capture: false },
      response: Responses.goFrontBack('info'),
    },
    {
      id: 'O12S Oversampled Wave Cannon Right',
      type: 'StartsUsing',
      netRegex: { id: '3364', source: 'Omega', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' || data.job === 'BLU')
          return output.monitorsLeft!();

        return output.dodgeLeft!();
      },
      outputStrings: {
        monitorsLeft: {
          en: 'Monitors Left',
          ja: '波動砲 (左)',
          ko: '모니터 왼쪽',
        },
        dodgeLeft: {
          en: 'Dodge Left',
          ja: '左側に離れる',
          ko: '오른쪽으로',
        },
      },
    },
    {
      id: 'O12S Oversampled Wave Cannon Left',
      type: 'StartsUsing',
      netRegex: { id: '3365', source: 'Omega', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' || data.job === 'BLU')
          return output.monitorsRight!();

        return output.dodgeRight!();
      },
      outputStrings: {
        monitorsRight: {
          en: 'Monitors Right',
          ja: '波動砲 (右)',
          ko: '모니터 오른쪽',
        },
        dodgeRight: {
          en: 'Dodge Right',
          ja: '右側に離れる',
          ko: '왼쪽으로',
        },
      },
    },
    {
      id: 'O12S Target Analysis Target',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      alarmText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.vulnOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return;
        if (data.role !== 'tank' && data.job !== 'BLU')
          return;
        return output.vulnOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        vulnOn: {
          en: 'Vuln on ${player}',
          ja: '${player}に標的',
          ko: '"${player}" 표적식별',
        },
        vulnOnYou: {
          en: 'Vuln on YOU',
          ja: '自分に標的',
          ko: '표적식별 대상자',
        },
      },
    },
    {
      // Local Regression
      id: 'O12S Local Tethers',
      type: 'GainsEffect',
      netRegex: { effectId: '688' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Close Tethers',
          ja: 'ニアー',
          ko: '가까이 붙는 줄',
        },
      },
    },
    {
      // Remote Regression
      id: 'O12S Far Tethers',
      type: 'GainsEffect',
      netRegex: { effectId: '689' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Far Tethers',
          ja: 'ファー',
          ko: '멀리 떨어지는 줄',
        },
      },
    },
    {
      // Critical Overflow Bug
      id: 'O12S Defamation',
      type: 'GainsEffect',
      netRegex: { effectId: '681' },
      condition: Conditions.targetIsYou(),
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Defamation on YOU',
          ja: 'サークルついた',
          ko: '치명적오류:광역 8초',
        },
      },
    },
    {
      id: 'O12S Latent Defect',
      type: 'GainsEffect',
      netRegex: { effectId: '686' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Blue Marker',
          ja: 'レイテントついた',
          ko: '잠재적오류 10초',
        },
      },
    },
    {
      // Critical Underflow Bug
      id: 'O12S Rot',
      type: 'GainsEffect',
      netRegex: { effectId: '682' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Rot',
          ja: 'デグレードついた',
          ko: '치명적오류:전이 14초',
        },
      },
    },
    {
      // Critical Synchronization Bug
      id: 'O12S Hello World Stack',
      type: 'GainsEffect',
      netRegex: { effectId: '680' },
      delaySeconds: (data, matches) => matches.target === data.me ? 0 : 1,
      alertText: (data, matches, output) => {
        const t = parseFloat(matches.duration);
        if (data.me !== matches.target)
          return;
        if (!(t > 0))
          return;
        if (t <= 8)
          return output.shortStackOnYou!();

        return output.longStackOnYou!();
      },
      infoText: (data, matches, output) => {
        const t = parseFloat(matches.duration);
        if (data.me === matches.target)
          return;
        if (!data.dpsShortStack)
          return;
        if (!(t > 0))
          return;
        if (t <= 8) {
          data.dpsShortStack = false;
          // It can be useful to know who has the short stack because they
          // might need an extra shield.  However, common blu strats have
          // folks diamondback this, so it's just noise.
          if (data.job !== 'BLU')
            return output.shortStackOn!({ player: data.party.member(matches.target) });
        }
        return;
      },
      outputStrings: {
        shortStackOn: {
          en: 'Short Stack on ${player}',
          ja: '${player}に早シェア',
          ko: '"${player}" 쉐어',
        },
        shortStackOnYou: {
          en: 'Short Stack on YOU',
          ja: '自分に早シェア',
          ko: '8초 치명적오류:분배(쉐어)',
        },
        longStackOnYou: {
          en: 'Long Stack on YOU',
          ja: '自分に遅シェア',
          ko: '13초 치명적오류:분배(쉐어)',
        },
      },
    },
    {
      id: 'O12S Hello World Initial Debuff Collect',
      type: 'GainsEffect',
      // These effects are all handled elsewhere.
      // Collect who has them, but don't call them out here.
      // 680 = Critical Synchronization Bug (short/long stack)
      // 681 = Critical Overflow Bug (defamation)
      // 682 = Critical Underflow Bug (rot, only on HW2)
      // 686 = Latent Defect (blue dna marker)
      netRegex: { effectId: ['680', '681', '682', '686'] },
      condition: (data) => !data.calledHelloNoMarker,
      run: (data, matches) => {
        data.helloDebuffs ??= {};
        data.helloDebuffs[matches.target] = matches.effectId;
      },
    },
    {
      id: 'O12S Hello World No Marker',
      type: 'GainsEffect',
      netRegex: { effectId: ['680', '681', '682', '686'], capture: false },
      condition: (data) => !data.calledHelloNoMarker,
      delaySeconds: 0.3,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.me in (data.helloDebuffs ?? {}))
          return;
        return output.text!();
      },
      run: (data) => data.calledHelloNoMarker = true,
      outputStrings: {
        text: {
          en: 'No Marker',
          ja: '無職',
          ko: '무징 대상자',
        },
      },
    },
    {
      // Cascading Latent Defect
      id: 'O12S Hello World Tower Complete',
      type: 'GainsEffect',
      netRegex: { effectId: '687' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move out for Defamation',
          ja: 'サークルを捨てる',
          ko: '잠재적 오류: 전이',
        },
      },
    },
    {
      id: 'O12S Archive All Marker Tracking',
      type: 'HeadMarker',
      netRegex: { id: ['003E', '0060'] },
      condition: (data) => data.isFinalOmega,
      run: (data, matches) => {
        data.archiveMarkers ??= {};
        data.archiveMarkers[matches.target] = matches.id;
      },
    },
    {
      id: 'O12S Archive All No Marker',
      type: 'HeadMarker',
      netRegex: { id: ['003E', '0060'], capture: false },
      condition: (data) => {
        // 4 fire markers, 1 stack marker.
        if (!data.isFinalOmega)
          return false;
        return data.archiveMarkers && Object.keys(data.archiveMarkers).length === 5;
      },
      infoText: (data, _matches, output) => {
        if (data.me in (data.archiveMarkers ?? {}))
          return;
        for (const player in data.archiveMarkers) {
          if (data.archiveMarkers[player] !== '003E')
            continue;
          return output.text!({ player: data.party.member(player) });
        }
      },
      outputStrings: {
        text: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'O12S Archive All Stack Marker',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      condition: (data, matches) => data.isFinalOmega && matches.target === data.me,
      response: Responses.stackMarkerOn('info'),
    },
    {
      id: 'O12S Archive All Spread Marker',
      type: 'HeadMarker',
      netRegex: { id: '0060' },
      condition: (data, matches) => data.isFinalOmega && matches.target === data.me,
      response: Responses.spread(),
    },
    {
      id: 'O12S Archive All Blue Arrow',
      type: 'HeadMarker',
      netRegex: { target: 'Rear Power Unit', id: '009D', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Back Left',
          ja: '左後ろ',
          ko: '좌측 후방',
        },
      },
    },
    {
      id: 'O12S Archive All Red Arrow',
      type: 'HeadMarker',
      netRegex: { target: 'Rear Power Unit', id: '009C', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Back Right',
          ja: '右後ろ',
          ko: '우측 후방',
        },
      },
    },
    {
      id: 'O12S Archive  Peripheral Tracking',
      type: 'HeadMarker',
      netRegex: { target: 'Right Arm Unit', id: ['009C', '009D'] },
      run: (data, matches) => {
        // Create a 3 digit binary value, R = 0, B = 1.
        // e.g. BBR = 110 = 6
        data.armValue ??= 0;
        data.numArms ??= 0;
        data.armValue *= 2;
        if (matches.id === '009D')
          data.armValue += 1;
        data.numArms++;
      },
    },
    {
      id: 'O12S Archive Peripheral',
      type: 'HeadMarker',
      netRegex: { target: 'Right Arm Unit', id: ['009C', '009D'], capture: false },
      condition: (data) => data.numArms === 3,
      alertText: (data, _matches, output) => {
        if (!data.armValue || !(data.armValue >= 0) || data.armValue > 7)
          return;
        const outputs: { [armValue: number]: string | undefined } = {
          0b000: output.east!(),
          0b001: output.northeast!(),
          0b010: undefined,
          0b011: output.northwest!(),
          0b100: output.southeast!(),
          0b101: undefined,
          0b110: output.southwest!(),
          0b111: output.west!(),
        };
        return outputs[data.armValue];
      },
      outputStrings: {
        east: Outputs.east,
        northeast: Outputs.northeast,
        northwest: Outputs.northwest,
        southeast: Outputs.southeast,
        southwest: Outputs.southwest,
        west: Outputs.west,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Synthetic Blades/Synthetic Shield': 'Synthetic Blades/Shield',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Left Arm Unit': 'link(?:e|er|es|en) Arm',
        'Omega(?!-)': 'Omega',
        'Omega-F': 'Omega-W',
        'Omega-M': 'Omega-M',
        'Optical Unit': 'Optikmodul',
        'Rear Power Unit': 'hinter(?:e|er|es|en) Antriebseinheit',
        'Right Arm Unit': 'rechter Arm',
      },
      'replaceText': {
        'Advanced Optical Laser': 'Optischer Laser S',
        'Advanced Suppression': 'Hilfsprogramm S',
        '(?<! )Archive All': 'Alles archivieren',
        '(?<! )Archive Peripheral': 'Archiv-Peripherie',
        'Beyond Defense': 'Schildkombo S',
        'Beyond Strength': 'Schildkombo G',
        'Cascading Latent Defect': 'Latenter Defekt: Zersetzung',
        'Colossal Blow': 'Kolossaler Hieb',
        'Cosmo Memory': 'Kosmospeicher',
        'Critical Error': 'Schwerer Ausnahmefehler',
        'Critical Overflow Bug': 'Kritischer Bug: Überlauf',
        'Critical Synchronization Bug': 'Kritischer Bug: Synchronisierung',
        'Critical Underflow Bug': 'Kritischer Bug: Unterlauf',
        'Delta Attack': 'Delta-Attacke',
        'Diffuse Wave Cannon': 'Streuende Wellenkanone',
        'Discharger': 'Entlader',
        'Efficient Bladework': 'Effiziente Klingenführung',
        'Electric Slide': 'Elektrosturz',
        'Firewall': 'Sicherungssystem',
        'Floodlight': 'Flutlicht',
        'Fundamental Synergy': 'Synergieprogramm C',
        'Hello, World': 'Hallo, Welt!',
        'Hyper Pulse': 'Hyper-Impuls',
        'Index and Archive Peripheral': 'Archiv-Peripherie X',
        'Ion Efflux': 'Ionenstrom',
        'Laser Shower': 'Laserschauer',
        'Operational Synergy': 'Synergieprogramm W',
        '(?<! )Optical Laser': 'Optischer Laser F',
        'Optimized Blade Dance': 'Omega-Schwertertanz',
        'Optimized Blizzard III': 'Omega-Eisga',
        'Optimized Fire III': 'Omega-Feuga',
        'Optimized Meteor': 'Omega-Meteor',
        'Optimized Sagittarius Arrow': 'Omega-Choral der Pfeile',
        'Oversampled Wave Cannon': 'Fokussierte Wellenkanone',
        'Patch': 'Regression',
        'Pile Pitch': 'Neigungsstoß',
        'Program Omega': 'Programm Omega',
        'Resonance': 'Resonanz',
        'Savage Wave Cannon': 'Grausame Wellenkanone',
        'Solar Ray': 'Sonnenstrahl',
        'Spotlight': 'Scheinwerfer',
        'Subject Simulation F': 'Transformation W',
        'Subject Simulation M': 'Transformation M',
        'Superliminal Motion': 'Klingenkombo F',
        'Superliminal Steel': 'Klingenkombo B',
        '(?<! )Suppression': 'Hilfsprogramm F',
        'Synthetic Blades': 'Synthetische Klinge',
        'Synthetic Shield': 'Synthetischer Schild',
        'Target Analysis': 'Wellenkanone',
        '(?<! )Wave Cannon': 'Wellenkanone',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Left Arm Unit': 'unité bras gauche',
        'Omega(?!-)': 'Oméga',
        'Omega-F': 'Oméga-F',
        'Omega-M': 'Oméga-M',
        'Optical Unit': 'unité optique',
        'Rear Power Unit': 'unité arrière',
        'Right Arm Unit': 'unité bras droit',
      },
      'replaceText': {
        '\\?': ' ?',
        'Advanced Optical Laser': 'Laser optique S',
        'Advanced Suppression': 'Programme d\'assistance S',
        '(?<! )Archive All': 'Archivage intégral',
        '(?<! )Archive Peripheral': 'Périphérique d\'archivage',
        'Beyond Defense': 'Combo bouclier S',
        'Beyond Strength': 'Combo bouclier G',
        'Cascading Latent Defect': 'Bogue latent : dégradation',
        'Colossal Blow': 'Coup colossal',
        'Cosmo Memory': 'Cosmomémoire',
        'Critical Error': 'Erreur critique',
        'Critical Overflow Bug': 'Bogue critique : boucle',
        'Critical Synchronization Bug': 'Bogue critique : partage',
        'Critical Underflow Bug': 'Bogue critique : dégradation',
        'Delta Attack': 'Attaque Delta',
        'Diffuse Wave Cannon': 'Canon plasma diffuseur',
        'Discharger': 'Déchargeur',
        'Efficient Bladework': 'Lame active',
        'Electric Slide': 'Glissement Oméga',
        'Firewall': 'Programme protecteur',
        'Floodlight': 'Projecteur',
        'Fundamental Synergy': 'Programme synergique C',
        'Hello, World': 'Bonjour, le monde',
        'Hyper Pulse': 'Hyperpulsion',
        'Index and Archive Peripheral': 'Périphérique d\'archivage X',
        'Ion Efflux': 'Fuite d\'ions',
        'Laser Shower': 'Pluie de lasers',
        'Operational Synergy': 'Programme synergique W',
        '(?<! )Optical Laser': 'Laser optique F',
        'Optimized Blade Dance': 'Danse de la lame Oméga',
        'Optimized Blizzard III': 'Méga Glace Oméga',
        'Optimized Fire III': 'Méga Feu Oméga',
        'Optimized Meteor': 'Météore Oméga',
        'Optimized Sagittarius Arrow': 'Flèche du sagittaire Oméga',
        'Oversampled Wave Cannon': 'Canon plasma chercheur',
        'Patch': 'Bogue intentionnel',
        'Pile Pitch': 'Lancement de pieu',
        'Program Omega': 'Programme Oméga',
        'Resonance': 'Résonance',
        'Savage Wave Cannon': 'Canon plasma absolu',
        'Solar Ray': 'Rayon solaire',
        'Spotlight': 'Phare',
        'Subject Simulation F': 'Transformation F',
        'Subject Simulation M': 'Simulation de sujet M',
        'Superliminal Motion': 'Combo lame F',
        'Superliminal Steel': 'Combo lame B',
        '(?<! )Suppression': 'Programme d\'assistance F',
        'Synthetic Blades(?!/)': 'Lame optionnelle',
        'Synthetic Blades/Synthetic Shield': 'Lame/Bouclier optionel',
        '(?<!/)Synthetic Shield': 'Bouclier optionnel',
        'Target Analysis': 'Analyse de cible',
        '(?<! )Wave Cannon': 'Canon plasma',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Left Arm Unit': 'レフトアームユニット',
        '(?<! )Omega(?!-)': 'オメガ',
        'Omega-F': 'オメガF',
        'Omega-M': 'オメガM',
        'Optical Unit': 'オプチカルユニット',
        'Rear Power Unit': 'リアユニット',
        'Right Arm Unit': 'ライトアームユニット',
        'I am the Omega': 'ワタシはオメガであり',
      },
      'replaceText': {
        'Advanced Optical Laser': 'オプチカルレーザーS',
        'Advanced Suppression': '援護プログラムS',
        '(?<! )Archive All': 'アーカイブオール',
        '(?<! )Archive Peripheral': 'アーカイブアーム',
        'Beyond Defense': 'シールドコンボS',
        'Beyond Strength': 'シールドコンボG',
        'Cascading Latent Defect': 'レイテンドバグ：デグレード',
        'Colossal Blow': 'コロッサスブロー',
        'Cosmo Memory': 'コスモメモリー',
        'Critical Error': 'クリティカルエラー',
        'Critical Overflow Bug': 'クリティカルバグ：サークル',
        'Critical Synchronization Bug': 'クリティカルバグ：シェア',
        'Critical Underflow Bug': 'クリティカルバグ：デグレード',
        'Delta Attack': 'デルタアタック',
        'Diffuse Wave Cannon': '拡散波動砲',
        'Discharger': 'ディスチャージャー',
        'Efficient Bladework': 'ソードアクション',
        'Electric Slide': 'オメガスライド',
        'Firewall': 'ガードプログラム',
        'Floodlight': 'フラッドライト',
        'Fundamental Synergy': '連携プログラムC',
        'Hello, World': 'ハロー・ワールド',
        'Hyper Pulse': 'ハイパーパルス',
        'Index and Archive Peripheral': 'アーカイブアームX',
        'Ion Efflux': 'イオンエフラクス',
        'Laser Shower': 'レーザーシャワー',
        'Operational Synergy': '連携プログラムW',
        '(?<! )Optical Laser': 'オプチカルレーザーF',
        'Optimized Blade Dance': 'ブレードダンス・オメガ',
        'Optimized Blizzard III': 'ブリザガ・オメガ',
        'Optimized Fire III': 'ファイラ・オメガ',
        'Optimized Meteor': 'メテオ・オメガ',
        'Optimized Sagittarius Arrow': 'サジタリウスアロー・オメガ',
        'Oversampled Wave Cannon': '検知式波動砲',
        'Patch': 'エンバグ',
        'Pile Pitch': 'パイルピッチ',
        'Program Omega': 'プログラム・オメガ',
        'Resonance': 'レゾナンス',
        'Savage Wave Cannon': '零式波動砲',
        'Solar Ray': 'ソーラレイ',
        'Spotlight': 'スポットライト',
        'Subject Simulation F': 'トランスフォームF',
        'Subject Simulation M': 'トランスフォームM',
        'Superliminal Motion': 'ブレードコンボF',
        'Superliminal Steel': 'ブレードコンボB',
        '(?<! )Suppression': '援護プログラムF',
        'Synthetic Blades': 'ブレードオプション',
        'Synthetic Shield': 'シールドオプション',
        'Target Analysis': '標的識別',
        '(?<! )Wave Cannon': '波動砲',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Left Arm Unit': '左臂组',
        'Omega(?!-)': '欧米茄',
        'Omega-F': '欧米茄F',
        'Omega-M': '欧米茄M',
        'Optical Unit': '视觉组',
        'Rear Power Unit': '尾部组',
        'Right Arm Unit': '右臂组',
      },
      'replaceText': {
        'Advanced Optical Laser': '光学射线S',
        'Advanced Suppression': '援护程序S',
        '(?<! )Archive All': '全归档',
        '(?<! )Archive Peripheral': '手臂归档',
        'Beyond Defense': '盾连击S',
        'Beyond Strength': '盾连击G',
        'Cascading Latent Defect': '潜在错误：下溢',
        'Colossal Blow': '巨能爆散',
        'Cosmo Memory': '宇宙记忆',
        'Critical Error': '严重错误',
        'Critical Overflow Bug': '严重错误：上溢',
        'Critical Synchronization Bug': '严重错误：同步',
        'Critical Underflow Bug': '严重错误：下溢',
        'Delta Attack': '三角攻击',
        'Diffuse Wave Cannon': '扩散波动炮',
        'Discharger': '能量放出',
        'Efficient Bladework': '剑击',
        'Electric Slide': '欧米茄滑跃',
        'Firewall': '防御程序',
        'Floodlight': '泛光灯',
        'Fundamental Synergy': '协作程序C',
        'Hello, World': '你好，世界',
        'Hyper Pulse': '超能脉冲',
        'Index and Archive Peripheral': '手臂归档X',
        'Ion Efflux': '离子流出',
        'Laser Shower': '激光骤雨',
        'Operational Synergy': '协作程序W',
        '(?<! )Optical Laser': '光学射线F',
        'Optimized Blade Dance': '欧米茄刀光剑舞',
        'Optimized Blizzard III': '欧米茄冰封',
        'Optimized Fire III': '欧米茄烈炎',
        'Optimized Meteor': '欧米茄陨石流星',
        'Optimized Sagittarius Arrow': '欧米茄射手天箭',
        'Oversampled Wave Cannon': '探测式波动炮',
        'Patch': '补丁',
        'Pile Pitch': '能量投射',
        'Program Omega': '程序·欧米茄',
        'Resonance': '共鸣',
        'Savage Wave Cannon': '零式波动炮',
        'Solar Ray': '太阳射线',
        'Spotlight': '聚光灯',
        'Subject Simulation F': '变形F',
        'Subject Simulation M': '变形M',
        'Superliminal Motion': '剑连击F',
        'Superliminal Steel': '剑连击B',
        '(?<! )Suppression': '援护程序F',
        'Synthetic Blades': '合成剑',
        'Synthetic Shield': '合成盾',
        'Target Analysis': '目标识别',
        '(?<! )Wave Cannon': '波动炮',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Left Arm Unit': '左臂組',
        'Omega(?!-)': '歐米茄',
        'Omega-F': '歐米茄F',
        'Omega-M': '歐米茄M',
        'Optical Unit': '視覺組',
        'Rear Power Unit': '尾部組',
        'Right Arm Unit': '右臂組',
      },
      'replaceText': {
        'Advanced Optical Laser': '光學射線S',
        'Advanced Suppression': '援護程式S',
        '(?<! )Archive All': '全歸檔',
        '(?<! )Archive Peripheral': '手臂歸檔',
        'Beyond Defense': '盾連擊S',
        'Beyond Strength': '盾連擊G',
        'Cascading Latent Defect': '潛在錯誤：下溢',
        'Colossal Blow': '巨能爆散',
        'Cosmo Memory': '宇宙記憶',
        'Critical Error': '嚴重錯誤',
        'Critical Overflow Bug': '嚴重錯誤：上溢',
        'Critical Synchronization Bug': '嚴重錯誤：同步',
        'Critical Underflow Bug': '嚴重錯誤：下溢',
        'Delta Attack': '三角攻擊',
        'Diffuse Wave Cannon': '擴散波動砲',
        'Discharger': '能量放出',
        'Efficient Bladework': '劍擊',
        'Electric Slide': '歐米茄滑躍',
        'Firewall': '防禦程式',
        'Floodlight': '泛光燈',
        'Fundamental Synergy': '協作程式C',
        'Hello, World': 'Hello, World',
        'Hyper Pulse': '超能脈衝',
        'Index and Archive Peripheral': '手臂歸檔X',
        'Ion Efflux': '離子流出',
        'Laser Shower': '雷射驟雨',
        'Operational Synergy': '協作程式W',
        '(?<! )Optical Laser': '光學射線F',
        'Optimized Blade Dance': '歐米茄刀光劍舞',
        'Optimized Blizzard III': '歐米茄大暴雪',
        'Optimized Fire III': '歐米茄・中火焰',
        'Optimized Meteor': '歐米茄隕石流星',
        'Optimized Sagittarius Arrow': '歐米茄射手天箭',
        'Oversampled Wave Cannon': '探測式波動砲',
        'Patch': '更新',
        'Pile Pitch': '能量投射',
        'Program Omega': '程式·歐米茄',
        'Resonance': '共鳴',
        'Savage Wave Cannon': '零式波動砲',
        'Solar Ray': '太陽射線',
        'Spotlight': '聚光燈',
        'Subject Simulation F': '變形F',
        'Subject Simulation M': '變形M',
        'Superliminal Motion': '劍連擊F',
        'Superliminal Steel': '劍連擊B',
        '(?<! )Suppression': '援護程式F',
        'Synthetic Blades': '合成劍',
        'Synthetic Shield': '合成盾',
        'Target Analysis': '目標識別',
        '(?<! )Wave Cannon': '波動砲',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Left Arm Unit': '왼팔 유닛',
        'Omega(?!-)': '오메가',
        'Omega-F': '오메가 F',
        'Omega-M': '오메가 M',
        'Optical Unit': '광학 유닛',
        'Rear Power Unit': '후면 유닛',
        'Right Arm Unit': '오른팔 유닛',
      },
      'replaceText': {
        'Advanced Optical Laser': '광학 레이저 S',
        'Advanced Suppression': '지원 프로그램 S',
        '(?<! )Archive All': '전체 기록 보존',
        '(?<! )Archive Peripheral': '기록 보존 장치',
        'Beyond Defense': '방패 연격 S',
        'Beyond Strength': '방패 연격 G',
        'Cascading Latent Defect': '잠재적 오류: 전이',
        'Colossal Blow': '광역 폭파',
        'Cosmo Memory': '세계의 기억',
        'Critical Error': '치명적인 오류',
        'Critical Overflow Bug': '치명적 오류: 광역',
        'Critical Synchronization Bug': '치명적 오류: 분배',
        'Critical Underflow Bug': '치명적 오류: 전이',
        'Delta Attack': '델타 공격',
        'Diffuse Wave Cannon': '확산 파동포',
        'Discharger': '방출',
        'Efficient Bladework': '검격',
        'Electric Slide': '오메가 슬라이드',
        'Firewall': '방어 프로그램',
        'Floodlight': '투광 조명',
        'Fundamental Synergy': '연계 프로그램 C',
        'Hello, World': '헬로 월드',
        'Hyper Pulse': '초파동 광선',
        'Index and Archive Peripheral': '기록 보존 장치 X',
        'Ion Efflux': '이온 유출',
        'Laser Shower': '레이저 세례',
        'Operational Synergy': '연계 프로그램 W',
        '(?<! )Optical Laser': '광학 레이저 F',
        'Optimized Blade Dance': '쾌검난무: 오메가',
        'Optimized Blizzard III': '블리자가: 오메가',
        'Optimized Fire III': '파이라: 오메가',
        'Optimized Meteor': '메테오 : 오메가',
        'Optimized Sagittarius Arrow': '궁수자리 화살: 오메가',
        'Oversampled Wave Cannon': '감지식 파동포',
        'Patch': '연쇄 오류',
        'Pile Pitch': '에너지 투사',
        'Program Omega': '프로그램: 오메가',
        'Resonance': '공명',
        'Savage Wave Cannon': '프로그램: 오메가',
        'Solar Ray': '태양 광선',
        'Spotlight': '집중 조명',
        'Subject Simulation F': '형태 변경 F',
        'Subject Simulation M': '형태 변경 M',
        'Superliminal Motion': '칼날 연격 F',
        'Superliminal Steel': '칼날 연격 B',
        '(?<! )Suppression': '지원 프로그램 F',
        'Synthetic Blades': '칼날 장착',
        'Synthetic Shield': '방패 장착',
        'Target Analysis': '표적 식별',
        '(?<! )Wave Cannon': '파동포',
      },
    },
  ],
};

export default triggerSet;
