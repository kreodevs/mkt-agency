import { useEffect, useRef } from 'react';
import type { AgencyNotification } from '@/types/publication-inbox';

const NOTIFIED_KEY = 'mkt:soho-notified-ids';

function loadNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.slice(-50));
  } catch {
    return new Set();
  }
}

function saveNotifiedIds(ids: Set<string>): void {
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...ids].slice(-50)));
}

/** Notificaciones del navegador cuando hay avisos nuevos en bandeja (SOHO). */
export function useSohoBrowserNotifications(
  notifications: AgencyNotification[],
  enabled: boolean,
): void {
  const notifiedRef = useRef(loadNotifiedIds());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => undefined);
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    for (const notification of notifications) {
      if (notifiedRef.current.has(notification.id)) {
        continue;
      }

      if (
        notification.type === 'week_ready' ||
        notification.type === 'publish_reminder' ||
        notification.type === 'approval_reminder'
      ) {
        new Notification(notification.title, { body: notification.body });
        notifiedRef.current.add(notification.id);
      }
    }

    saveNotifiedIds(notifiedRef.current);
  }, [notifications, enabled]);
}
