/**
 * notificationService.js
 * Hybrid API & persistent hybrid store service for Enterprise Notification Engine (Module 9).
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import {
  getCollection,
  getStore,
  createNotificationItem,
  toggleNotificationReadState,
  markAllNotificationsReadForUser,
  saveNotificationPreferencesData,
} from '../utils/hybridStore';

export function getNotifications(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/notifications', { params: { employeeId } }),
    normalize: (n) => n,
    fallbackKey: 'notifications',
    moduleName: 'Notifications',
  }).then(list => {
    if (employeeId && Array.isArray(list)) {
      return list.filter(n => !n.employeeId || Number(n.employeeId) === Number(employeeId));
    }
    return list;
  });
}

export function sendNotification(notificationData) {
  return createNotificationItem(notificationData);
}

export function toggleNotificationRead(id) {
  return toggleNotificationReadState(id);
}

export function markAllRead(employeeId = null) {
  return markAllNotificationsReadForUser(employeeId);
}

export function getNotificationPreferences(employeeId = null) {
  const store = getStore();
  return store.notification_preferences || {};
}

export function updateNotificationPreferences(prefs) {
  return saveNotificationPreferencesData(prefs);
}

export function getNotificationDeliveryLogs() {
  const store = getStore();
  return store.notification_delivery_logs || [];
}
