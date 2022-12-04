import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 141-150

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors141_150,

  triggers: [
    // ---------------- Floor 141-149 Mobs ----------------
    {
      id: 'PotD 141-150 Deep Palace Bhoot Paralyze III',
      // inflicts Paralyze
      type: 'StartsUsing',
      netRegex: { id: '18F2', source: 'Deep Palace Bhoot' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Persona Paralyze III',
      // same ability name, different mob
      // inflicts Paralyze
      type: 'StartsUsing',
      netRegex: { id: '18F4', source: 'Deep Palace Persona' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Wraith Scream',
      // inflicts Terror (42)
      type: 'StartsUsing',
      netRegex: { id: '190A', source: 'Deep Palace Wraith' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Succubus Void Fire IV',
      // very large AoE
      type: 'StartsUsing',
      netRegex: { id: '1B81', source: 'Deep Palace Succubus' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 141-150 Deep Palace Manticore Ripper Claw',
      // untelegraphed front cone AoE
      type: 'StartsUsing',
      netRegex: { id: '18FA', source: 'Deep Palace Manticore', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PotD 141-150 Onyx Dragon Evil Eye',
      // gaze, inflicts Terror (42), combos with Miasma Breath (1B82)
      type: 'StartsUsing',
      netRegex: { id: '1B83', source: 'Onyx Dragon', capture: false },
      response: Responses.lookAway('alert'),
    },
    // ---------------- Floor 150 Boss: Tisiphone ----------------
    {
      id: 'PotD 141-150 Tisiphone Blood Rain',
      // big roomwide AoE
      type: 'StartsUsing',
      netRegex: { id: '1BF1', source: 'Tisiphone', capture: false },
      response: Responses.bigAoe('alert'),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Deep Palace Bhoot': 'Katakomben-Bhut',
        'Deep Palace Manticore': 'Katakomben-Manticore',
        'Deep Palace Persona': 'Katakomben-Persona',
        'Deep Palace Succubus': 'Katakomben-Sukkubus',
        'Deep Palace Wraith': 'Katakomben-Geist',
        'Onyx Dragon': 'Onyxdrache',
        'Tisiphone': 'Tisiphone',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Deep Palace Bhoot': 'bhut des profondeurs',
        'Deep Palace Manticore': 'manticore des profondeurs',
        'Deep Palace Persona': 'persona des profondeurs',
        'Deep Palace Succubus': 'succube des profondeurs',
        'Deep Palace Wraith': 'spectre des profondeurs',
        'Onyx Dragon': 'dragon d\'onyx',
        'Tisiphone': 'Tisiphone',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Deep Palace Bhoot': '�ǫ�?�׫ѫ쫹?�֫�?��',
        'Deep Palace Manticore': '�ǫ�?�׫ѫ쫹?�ޫ�ƫ�����',
        'Deep Palace Persona': '�ǫ�?�׫ѫ쫹?�ګ뫽��',
        'Deep Palace Succubus': '�ǫ�?�׫ѫ쫹?������Ы�',
        'Deep Palace Wraith': '�ǫ�?�׫ѫ쫹?�쫤��',
        'Onyx Dragon': '���˫����ɫ髴��',
        'Tisiphone': '�ƫ�?���ݫ�?',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Deep Palace Bhoot': '�?ݩ?',
        'Deep Palace Manticore': '�?غ�к',
        'Deep Palace Persona': '�?ʣ��',
        'Deep Palace Succubus': '�??ت',
        'Deep Palace Wraith': '�?��?',
        'Onyx Dragon': '?��к��?',
        'Tisiphone': '������',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Deep Palace Bhoot': '���� ���� ����Ʈ',
        'Deep Palace Manticore': '���� ���� ��Ƽ�ھ�',
        'Deep Palace Persona': '���� ���� �丣�ҳ�',
        'Deep Palace Succubus': '���� ���� ��ť����',
        'Deep Palace Wraith': '���� ���� ����',
        'Onyx Dragon': '�ٸ��� �巡��',
        'Tisiphone': 'Ƽ������',
      },
    },
  ],
};

export default triggerSet;
