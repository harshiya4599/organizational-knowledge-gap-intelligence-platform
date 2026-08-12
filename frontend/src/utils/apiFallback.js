/**
 * apiFallback.js
 * Centralized API request executor with DTO normalization & Hybrid Store Fallback.
 *
 * Calls live backend API and returns normalized data.
 * If backend is temporarily offline, unauthenticated, or fails,
 * seamlessly falls back to the persistent centralized hybridStore data
 * so the platform is NEVER visually empty while preserving real backend
 * authority when available.
 */

import { getCollection } from './hybridStore';

/**
 * Executes a backend API request with DTO normalization and fallback recovery.
 *
 * @param {Object} config
 * @param {Function} config.request - Async function returning Axios response
 * @param {Function} [config.normalize] - Optional DTO normalization function
 * @param {string} [config.fallbackKey] - Collection name in hybridStore to fallback to
 * @param {string} [config.moduleName='Module'] - Module name for logging
 * @returns {Promise<any>}
 */
export async function fetchWithFallback({
  request,
  normalize = (data) => data,
  fallbackKey,
  moduleName = 'Module',
}) {
  if (typeof request !== 'function') {
    if (fallbackKey) {
      const fallbackData = getCollection(fallbackKey);
      return Array.isArray(fallbackData) ? fallbackData.map(normalize).filter(Boolean) : normalize(fallbackData);
    }
    throw new Error(`[${moduleName}] Request function is required.`);
  }

  try {
    const response = await request();
    const payload = response?.data !== undefined ? response.data : response;

    if (Array.isArray(payload) && payload.length > 0) {
      return payload.map(normalize).filter(Boolean);
    }

    if (payload && typeof payload === 'object' && Object.keys(payload).length > 0) {
      return normalize(payload);
    }

    // If backend returned empty array and fallbackKey is configured, use fallback to avoid blank views
    if (fallbackKey) {
      const fallbackData = getCollection(fallbackKey);
      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        return fallbackData.map(normalize).filter(Boolean);
      }
    }

    return Array.isArray(payload) ? payload : [];
  } catch (err) {
    console.warn(`[${moduleName}] Backend API call failed (${err.message}). Using hybrid store fallback.`);

    if (fallbackKey) {
      const fallbackData = getCollection(fallbackKey);
      if (Array.isArray(fallbackData)) {
        return fallbackData.map(normalize).filter(Boolean);
      }
      if (fallbackData && typeof fallbackData === 'object') {
        return normalize(fallbackData);
      }
    }

    // If no fallbackKey is provided, rethrow the error
    throw err;
  }
}
