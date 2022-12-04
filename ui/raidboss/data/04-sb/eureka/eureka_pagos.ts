import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheForbiddenLandEurekaPagos,
  resetWhenOutOfCombat: false,
  triggers: [
    {
      id: 'Eureka Pagos Falling Asleep',
      type: 'GameLog',
      netRegex: { line: '7 minutes have elapsed since your last activity..*?', capture: false },
      response: Responses.wakeUp(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?':
          'Seit deiner letzten Aktivitat sind 7 Minuten vergangen.',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '7 minutes have elapsed since your last activity.':
          'Votre personnage est inactif depuis 7 minutes',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        '7 minutes have elapsed since your last activity.': '���ª��ʪ�?���˪ʪêƪ���7�ª�?Φ���ު�����',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '7 minutes have elapsed since your last activity.': '�?7��??��?����������',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?': '7�� ���� �ƹ� ������ ���� �ʾҽ��ϴ�',
      },
    },
  ],
};

export default triggerSet;
