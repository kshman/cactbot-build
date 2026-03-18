import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Fishes = 'ge' | 'hema' | 'geobuk' | 'bok' | 'chocobo';

export interface Data extends RaidbossData {
  fishes: Fishes[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AnotherMerchantsTale',
  zoneId: ZoneId.AnotherMerchantsTale,
  initData: () => ({
    fishes: [],
  }),
  triggers: [
    {
      id: 'AMT Darya Familiar Call',
      type: 'StartsUsing',
      netRegex: { id: 'B2CB', source: 'Darya', capture: false },
      run: (data) => data.fishes = [],
    },
    // Seaborn Shrike 초코보
    // Seaborn Servant 복어
    // Seaborn Steed 해마
    // Seaborn Soldier 게
    // Shrike - Soldier - Steed - Servant
    // B30F B310 B311 B312 B313
  ],
};

export default triggerSet;
