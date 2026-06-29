import { restoreSuperadminOnExpiredImpersonation } from '@/lib/impersonation';

/**
 * Called when an impersonation token expires on page load.
 * Restores the superadmin session so the app doesn't flicker.
 */
export function tryRestoreSuperadmin(): void {
  restoreSuperadminOnExpiredImpersonation();
}
