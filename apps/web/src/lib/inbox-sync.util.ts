import type { QueryClient } from '@tanstack/react-query';
import {
  consumeInboxPendingSnapshot,
  diffNewInboxContentIds,
  markNewInboxContentIds,
} from '@/lib/inbox-new-items';
import type { PublicationInboxData } from '@/types/publication-inbox';

const INBOX_SYNC_ATTEMPTS = 10;
const INBOX_SYNC_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function inboxQueryKey(productId: string | null | undefined): [string, string | null] {
  return ['publication-inbox', productId ?? null];
}

/** Re-fetch bandeja hasta que aparezcan piezas generadas (evita refresh manual). */
export async function syncInboxAfterGeneration(
  queryClient: QueryClient,
  productId: string | null | undefined,
  expectedPosts: number,
  pendingIdsBefore?: Set<string>,
): Promise<string[]> {
  const key = inboxQueryKey(productId);

  for (let attempt = 0; attempt < INBOX_SYNC_ATTEMPTS; attempt += 1) {
    await queryClient.invalidateQueries({ queryKey: ['publication-inbox'] });
    await queryClient.refetchQueries({ queryKey: ['publication-inbox'], type: 'active' });

    const data = queryClient.getQueryData<PublicationInboxData>(key);
    const pending = data?.stats.pendingCount ?? 0;
    const totalVisible =
      pending + (data?.stats.readyCount ?? 0) + (data?.stats.upcomingCount ?? 0);

    if (expectedPosts <= 0 || pending >= expectedPosts || totalVisible >= expectedPosts) {
      const afterIds = data?.pendingApproval.map((item) => item.contentId) ?? [];
      const beforeIds = pendingIdsBefore ?? consumeInboxPendingSnapshot(productId);
      const newIds = beforeIds ? diffNewInboxContentIds(beforeIds, afterIds) : [];
      if (newIds.length > 0) {
        markNewInboxContentIds(productId, newIds);
      }
      return newIds;
    }

    if (attempt < INBOX_SYNC_ATTEMPTS - 1) {
      await sleep(INBOX_SYNC_DELAY_MS);
    }
  }

  return [];
}

/** Aviso week_ready con bandeja vacía → seguir refrescando. */
export function inboxNeedsHealSync(
  data: PublicationInboxData | undefined,
  activeProductId: string | null,
): boolean {
  if (!data) return false;
  if (data.stats.pendingCount > 0) return false;

  return data.notifications.some((notification) => {
    if (notification.type !== 'week_ready') return false;
    const postsGenerated = Number(notification.metadata?.postsGenerated ?? 0);
    if (postsGenerated <= 0) return false;
    if (activeProductId && notification.productId && notification.productId !== activeProductId) {
      return false;
    }
    return true;
  });
}

export function isCopilotPrepareWeekMutation(mutationKey: unknown): boolean {
  return Array.isArray(mutationKey) && mutationKey[0] === 'copilot-prepare-week';
}
