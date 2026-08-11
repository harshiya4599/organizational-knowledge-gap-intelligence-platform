/**
 * apiFallback.js
 * Centralized API request executor with DTO normalization.
 *
 * Calls live backend API and returns normalized data.
 * Throws backend/network errors so components can display proper ErrorState,
 * and passes empty data so components can display proper EmptyState.
 */

/**
 * Executes a backend API request with DTO normalization.
 *
 * @param {Object} config
 * @param {Function} config.request - Async function returning Axios response
 * @param {Function} [config.normalize] - Optional DTO normalization function
 * @param {string} [config.moduleName='Module'] - Module name for logging
 * @returns {Promise<any>}
 */
export async function fetchWithFallback({
  request,
  normalize = (data) => data,
  moduleName = 'Module',
}) {
  if (typeof request !== 'function') {
    throw new Error(`[${moduleName}] Request function is required.`);
  }

  const response = await request();
  const payload = response?.data !== undefined ? response.data : response;

  if (Array.isArray(payload)) {
    return payload.map(normalize).filter(Boolean);
  }

  if (payload && typeof payload === 'object') {
    return normalize(payload);
  }

  return payload;
}

