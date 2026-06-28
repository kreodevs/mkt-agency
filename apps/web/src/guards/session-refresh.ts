import { useAuthStore } from '@/store/auth';

/**
 * Called when an impersonation token expires on page load.
 * Restores the superadmin session so the app doesn't flicker.
 */
export function tryRestoreSuperadmin(): void {
  const store = useAuthStore.getState();
  if (store.impersonation && store.savedSuperadminSession) {
    store.endImpersonation(store.savedSuperadminSession.tokens.accessToken);
  }
}