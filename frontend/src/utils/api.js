/**
 * API utility - all calls to the FastAPI backend go through here.
 * Backend runs at http://localhost:8000
 */

const BASE_URL = 'http://localhost:8000'

/**
 * Predict gesture from 21 MediaPipe hand landmarks.
 * @param {Array} landmarks - Array of 21 {x, y, z} objects
 * @returns {Promise<{letter, confidence, method}>}
 */
export async function predictGesture(landmarks) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ landmarks }),
  })
  if (!res.ok) throw new Error(`Prediction failed: ${res.status}`)
  return res.json()
}

/**
 * Convert text to list of ISL sign image URLs.
 * @param {string} text
 * @returns {Promise<{letters, image_urls}>}
 */
export async function textToSign(text) {
  const res = await fetch(`${BASE_URL}/text-to-sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Text-to-sign failed: ${res.status}`)
  return res.json()
}

/**
 * Check if backend is reachable.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}
