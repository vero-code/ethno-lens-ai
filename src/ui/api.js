// src/ui/api.js

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// const API_BASE_URL = "https://ethno-lens-ai.onrender.com";
const API_BASE_URL = 'http://localhost:3000';

/**
 * Gets information about the user's limit usage.
 * @param {string} userId - User ID.
 * @param {AbortSignal} [signal] - AbortSignal to cancel the request.
 * @returns {Promise<{used: number, limit: number}>}
 */
export async function getUserUsage(userId, signal) {
  const response = await fetch(`${API_BASE_URL}/usage/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(
      errorData.error || 'Failed to get user usage',
      response.status,
    );
  }

  return await response.json();
}

/**
 * Analyzes design element.
 * @param {string} prompt - The prompt for analysis.
 * @param {string} userId - User ID.
 * @param {AbortSignal} [signal] - AbortSignal to cancel the request.
 * @returns {Promise<any>}
 */
export async function analyzeDesign(prompt, userId, signal) {
  console.log('2. FRONT: api.js -> analyzeDesign');
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, userId }),
    signal: signal,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(
      errorData.error || `Server error: ${response.status}`,
      response.status,
    );
  }
  return response.json();
}

/**
 * Analyzes an image.
 * @param {FormData} formData - The form data containing the image and other fields.
 * @param {AbortSignal} [signal] - AbortSignal to cancel the request.
 * @returns {Promise<any>}
 */
export async function analyzeImage(formData, signal) {
  const response = await fetch(`${API_BASE_URL}/analyze-image`, {
    method: 'POST',
    body: formData,
    signal: signal,
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiError(
      errorData.error || `Server error: ${response.status}`,
      response.status,
    );
  }
  return response.json();
}

export async function logPremiumInterest(userId) {
  await fetch(`${API_BASE_URL}/log-premium-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
}
