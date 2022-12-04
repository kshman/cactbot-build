import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 191-200

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors191_200,

  triggers: [
    // ---------------- Floor 191-199 Mobs ----------------
    {
      id: 'PotD 191-200 Deep Palace Wraith Scream',
      // inflicts Terror (42)
      // same as Floors 141-150
      type: 'StartsUsing',
      netRegex: { id: '190A', source: 'Deep Palace Wraith' },
      response: Responses.stunOrInterruptIfPossible(),
    },
    {
      id: 'PotD 191-200 Onyx Dragon Evil Eye',
      // gaze, inflicts Terror (42), combos with Miasma Breath (1B82)
      // same as Floors 141-150
      type: 'StartsUsing',
      netRegex: { id: '1B83', source: 'Onyx Dragon', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'PotD 191-200 Deep Palace Fachan Level 5 Death',
      // untelegraphed cone AoE that causes instant death
      type: 'StartsUsing',
      netRegex: { id: '1BAC', source: 'Deep Palace Fachan', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PotD 191-200 Deep Palace Knight Death Spiral',
      // donut AoE
      type: 'StartsUsing',
      netRegex: { id: '1BAA', source: 'Deep Palace Knight', capture: false },
      response: Responses.getIn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Deep Palace Fachan': 'Katakomben-Fachan',
        'Deep Palace Knight': 'Katakomben-Ritter',
        'Deep Palace Wraith': 'Katakomben-Geist',
        'Onyx Dragon': 'Onyxdrache',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Deep Palace Fachan': 'fachan des profondeurs',
        'Deep Palace Knight': 'chevalier des profondeurs',
        'Deep Palace Wraith': 'spectre des profondeurs',
        'Onyx Dragon': 'dragon d\'onyx',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Deep Palace Fachan': '�ǫ�?�׫ѫ쫹?�ի��ϫ�',
        'Deep Palace Knight': '�ǫ�?�׫ѫ쫹?�ʫ���',
        'Deep Palace Wraith': '�ǫ�?�׫ѫ쫹?�쫤��',
        'Onyx Dragon': '���˫����ɫ髴��',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Deep Palace Fachan': '�?��С����',
        'Deep Palace Knight': '�??��',
        'Deep Palace Wraith': '�?��?',
        'Onyx Dragon': '?��к��?',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Deep Palace Fachan': '���� ���� ����',
        'Deep Palace Knight': '���� ���� ���',
        'Deep Palace Wraith': '���� ���� ����',
        'Onyx Dragon': '�ٸ��� �巡��',
      },
    },
  ],
};

export default triggerSet;
