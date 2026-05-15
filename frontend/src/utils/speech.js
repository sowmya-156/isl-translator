/**
 * Speech utilities using the browser's Web Speech API.
 * Provides Text-to-Speech and Speech-to-Text functionality.
 */

/**
 * Speak text using the browser's TTS engine.
 * @param {string} text - Text to speak
 * @param {object} options - { rate, pitch, volume, lang }
 */
export function speak(text, options = {}) {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported in this browser.')
    return
  }
  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.lang || 'en-IN'   // Indian English
  utterance.rate = options.rate || 0.9
  utterance.pitch = options.pitch || 1.0
  utterance.volume = options.volume || 1.0

  window.speechSynthesis.speak(utterance)
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

/**
 * Check if speech synthesis is supported.
 */
export function isSpeechSupported() {
  return !!window.speechSynthesis
}

/**
 * Create a speech recognition instance (Speech-to-Text).
 * Returns a controller object with start/stop methods.
 *
 * @param {function} onResult - Called with transcript string
 * @param {function} onError - Called with error
 * @returns {{ start, stop }}
 */
export function createSpeechRecognizer(onResult, onError) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser. Try Chrome.')
    return { start: () => {}, stop: () => {} }
  }

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-IN'
  recognition.continuous = false
  recognition.interimResults = true

  recognition.onresult = (event) => {
    let transcript = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript
    }
    onResult?.(transcript, event.results[event.results.length - 1].isFinal)
  }

  recognition.onerror = (event) => {
    onError?.(event.error)
  }

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  }
}

/**
 * Check if speech recognition is supported.
 */
export function isRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}
