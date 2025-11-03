// src/ui/api.js

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// const API_BASE_URL = "https://ethno-lens-ai.onrender.com";
const API_BASE_URL = 'https://localhost:3000';

// --- helpers ---
async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Gets information about the user's limit usage.
 * @param {string} userId
 * @param {AbortSignal} [signal]
 * @returns {Promise<{used: number, limit: number}>}
 */
export async function getUserUsage(userId, signal) {
  const res = await fetch(`${API_BASE_URL}/usage/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!res.ok) {
    const err = await parseJsonSafe(res);
    throw new ApiError(err?.error || 'Failed to get user usage', res.status);
  }
  return await res.json();
}

/**
 * Analyze design element (returns { result, score?, opId? }).
 * @param {string} prompt
 * @param {string} userId
 * @param {AbortSignal} [signal]
 */
export async function analyzeDesign(prompt, userId, signal) {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, userId }),
    signal,
  });
  
  if (!res.ok) {
    const err = await parseJsonSafe(res);
    throw new ApiError(err?.error || `Server error: ${res.status}`, res.status);
  }
  return await res.json();
}

/**
 * Analyzes an image (returns { result, opId? }).
 * @param {FormData} formData
 * @param {AbortSignal} [signal]
 */
export async function analyzeImage(formData, signal) {
  const res = await fetch(`${API_BASE_URL}/analyze-image`, {
    method: 'POST',
    body: formData,
    signal,
  });
  if (!res.ok) {
    const err = await parseJsonSafe(res);
    throw new ApiError(err?.error || `Server error: ${res.status}`, res.status);
  }
  return await res.json();
}

/**
 * Log Premium interest.
 * @param {string} userId
 */
export async function logPremiumInterest(userId) {
  try {
    await fetch(`${API_BASE_URL}/log-premium-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
  } catch {}
}

/**
 * Confirms recorded usage for a user operation.
 * @param {string} opId
 * @param {string} userId
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ok: true}>}
 */
export async function confirmUsage(opId, userId, signal) {
  const res = await fetch(`${API_BASE_URL}/usage/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opId, userId }),
    signal,
  });
  
  if (!res.ok) {
    const err = await parseJsonSafe(res);
    throw new ApiError(err?.error || `Failed to confirm usage (${res.status})`, res.status);
  }
  return await res.json();
}
