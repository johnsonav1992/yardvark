import { Entry } from '../types/entries.types';

export const getEntryIcon = (entry: Entry) => {
  const entriesIconMap = {
    mow: 'li li-lawnmower',
    water: 'li li-sprinkler'
  };

  return (
    entriesIconMap[entry.activities[0]?.name as keyof typeof entriesIconMap] ||
    'ti ti-list'
  );
};
