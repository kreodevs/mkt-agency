import { useSyncExternalStore } from 'react';
import { getNewInboxContentIds, subscribeInboxNewItems } from '@/lib/inbox-new-items';

export function useInboxNewContentIds(productId: string | null | undefined): Set<string> {
  return useSyncExternalStore(
    subscribeInboxNewItems,
    () => getNewInboxContentIds(productId),
    () => getNewInboxContentIds(productId),
  );
}
