import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Heaven-on-High Floors 01-10
// TODO: Heavenly Shark Jaws tankbuster, can stun

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.HeavenOnHighFloors1_10,

  triggers: [
    // ---------------- Floor 01-09 Mobs ----------------
    {
      id: 'HoH 01-10 Heavenly Amikiri Shuck',
      // tankbuster, can stun
      type: 'StartsUsing',
      netRegex: { id: '2ECE', source: 'Heavenly Amikiri' },
      response: Responses.stunIfPossible(),
    },
    {
      id: 'HoH 01-10 Heavenly Uwabami Stone Gaze',
      // inflicts Petrify
      type: 'StartsUsing',
      netRegex: { id: '18CF', source: 'Heavenly Uwabami', capture: false },
      response: Responses.lookAway('alert'),
    },
    // ---------------- Floor 10 Boss: Mojabune ----------------
    {
      id: 'HoH 01-10 Mojabune Overtow',
      // knockback, knockback prevention does not work
      type: 'StartsUsing',
      netRegex: { id: '2E65', source: 'Mojabune', capture: false },
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Heavenly Amikiri': 'Himmelssaulen-Amikiri',
        'Heavenly Uwabami': 'Himmelssaulen-Uwabami',
        'Mojabune': 'Mojabune',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Heavenly Amikiri': 'Amikiri des Cieux',
        'Heavenly Uwabami': 'uwabami des Cieux',
        'Mojabune': 'Mojabune',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Heavenly Amikiri': '�����?���߫���',
        'Heavenly Uwabami': '�����?����Ы�',
        'Mojabune': '�⫦����֫�',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Heavenly Amikiri': '�����???',
        'Heavenly Uwabami': '����?��',
        'Mojabune': '�����',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Heavenly Amikiri': 'õ�� �ƹ�Ű��',
        'Heavenly Uwabami': 'õ�� �̹���',
        'Mojabune': '������ ��',
      },
    },
  ],
};

export default triggerSet;
