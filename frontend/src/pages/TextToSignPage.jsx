/**
 * TextToSignPage - Convert typed text or microphone input into
 * ISL gesture images shown in sequence (animated).
 *
 * Flow:
 *  1. User types text or uses mic (Web Speech API STT)
 *  2. On submit → POST /text-to-sign → get image URLs per letter
 *  3. Animate through images one by one with configurable speed
 */
import React, { useState, useEffect, useRef } from 'react'
import SignCard from '../components/SignCard.jsx'
import { ErrorBox, LoadingSpinner } from '../components/StatusBadge.jsx'
import { textToSign } from '../utils/api.js'
import { speak, createSpeechRecognizer, isRecognitionSupported } from '../utils/speech.js'

export default function TextToSignPage() {
  const [inputText, setInputText] = useState('')
  const [signs, setSigns] = useState([])        // [{ letter, imageUrl }]
  const [activeIdx, setActiveIdx] = useState(-1) // currently highlighted sign
  const [isAnimating, setIsAnimating] = useState(false)
  const [animSpeed, setAnimSpeed] = useState(700) // ms per sign
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [micTranscript, setMicTranscript] = useState('')

  const animTimer = useRef(null)
  const recognizerRef = useRef(null)

  // ── Convert text to signs via backend ──
  const handleConvert = async (text = inputText) => {
    const clean = (text || '').trim().toUpperCase()
    if (!clean) return

    try {
      setIsLoading(true)
      setError(null)
      setSigns([])
      setActiveIdx(-1)
      stopAnimation()

      const result = await textToSign(clean)
      const mapped = result.letters.map((letter, i) => ({
        letter,
        imageUrl: result.image_urls[i] || '',
        isSpace: letter === ' ',
      }))
      setSigns(mapped)
    } catch (err) {
      setError('Cannot reach backend. Make sure FastAPI is running on port 8000.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Animation: cycle through signs ──
  const startAnimation = () => {
    if (!signs.length) return
    setIsAnimating(true)
    setActiveIdx(0)
  }

  const stopAnimation = () => {
    setIsAnimating(false)
    setActiveIdx(-1)
    clearTimeout(animTimer.current)
  }

  useEffect(() => {
    if (!isAnimating || signs.length === 0) return

    animTimer.current = setTimeout(() => {
      setActiveIdx(prev => {
        if (prev >= signs.length - 1) {
          setIsAnimating(false)
          return -1
        }
        return prev + 1
      })
    }, animSpeed)

    return () => clearTimeout(animTimer.current)
  }, [isAnimating, activeIdx, signs, animSpeed])

  // Speak the current text
  const handleSpeak = () => {
    if (inputText.trim()) speak(inputText)
  }

  // ── Microphone (Speech-to-Text) ──
  const handleMicToggle = () => {
    if (isListening) {
      recognizerRef.current?.stop()
      setIsListening(false)
    } else {
      if (!isRecognitionSupported()) {
        setError('Speech recognition is not supported. Please use Chrome or Edge.')
        return
      }
      setMicTranscript('')
      const rec = createSpeechRecognizer(
        (transcript, isFinal) => {
          setMicTranscript(transcript)
          if (isFinal) {
            setInputText(transcript)
            setIsListening(false)
            handleConvert(transcript)
          }
        },
        (err) => {
          setError(`Mic error: ${err}`)
          setIsListening(false)
        }
      )
      recognizerRef.current = rec
      rec.start()
      setIsListening(true)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConvert()
  }

  const exampleWords = ['HELLO', 'INDIA', 'NAMASTE', 'PLEASE', 'THANK YOU', 'WATER', 'HELP', 'YES', 'NO']

  return (
    <div className="min-h-screen bg-grid-pattern pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold neon-text-purple mb-2">TEXT → ISL SIGNS</h1>
          <p className="text-gray-500 text-sm">
            Type text or use your microphone. Each letter is shown as an ISL gesture image.
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorBox message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Input Area */}
        <div className="glass-card rounded-xl p-6 mb-6 space-y-4">
          <div className="flex gap-3">
            {/* Text input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="TYPE HERE OR USE MIC..."
                className="w-full bg-[#12121a] border border-white/10 rounded px-4 py-3
                  font-display text-sm tracking-widest text-white placeholder-gray-600
                  focus:outline-none focus:border-[#bf00ff]/60 focus:shadow-[0_0_10px_rgba(191,0,255,0.2)]
                  transition-all"
              />
              {micTranscript && isListening && (
                <div className="absolute bottom-full left-0 mb-1 text-xs text-[#bf00ff] font-display animate-pulse">
                  🎙 {micTranscript}
                </div>
              )}
            </div>

            {/* Mic button */}
            <button
              onClick={handleMicToggle}
              className={`btn-neon px-4 ${isListening ? 'animate-pulse' : ''}`}
              style={{
                borderColor: isListening ? '#ff4d4d' : '#bf00ff',
                color: isListening ? '#ff4d4d' : '#bf00ff',
              }}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? '⏹ STOP' : '🎙 MIC'}
            </button>

            {/* Convert button */}
            <button
              onClick={() => handleConvert()}
              disabled={!inputText.trim() || isLoading}
              className="btn-neon btn-neon-purple px-6"
            >
              {isLoading ? <LoadingSpinner size="sm" color="#bf00ff" /> : 'CONVERT →'}
            </button>
          </div>

          {/* Speed control */}
          {signs.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-xs font-display text-gray-500 whitespace-nowrap">SPEED:</span>
              <input
                type="range"
                min={200}
                max={2000}
                step={100}
                value={animSpeed}
                onChange={e => setAnimSpeed(+e.target.value)}
                className="flex-1 accent-[#bf00ff] cursor-pointer"
              />
              <span className="text-xs font-display text-[#bf00ff] w-16 text-right">
                {animSpeed}ms
              </span>
            </div>
          )}

          {/* Example words */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-display text-gray-600 self-center">EXAMPLES:</span>
            {exampleWords.map(w => (
              <button
                key={w}
                onClick={() => { setInputText(w); handleConvert(w) }}
                className="text-xs font-display px-3 py-1 rounded border border-white/10 text-gray-400
                  hover:border-[#bf00ff]/40 hover:text-[#bf00ff] transition-all"
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Sign Display */}
        {signs.length > 0 && (
          <div className="glass-card rounded-xl p-6 space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs font-display text-gray-500">
                {signs.filter(s => !s.isSpace).length} LETTERS
                {activeIdx >= 0 && (
                  <span className="ml-3 text-[#bf00ff]">
                    SHOWING: {signs[activeIdx]?.letter}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={handleSpeak} className="btn-neon text-xs px-3 py-1.5">
                  🔊 SPEAK
                </button>
                {!isAnimating ? (
                  <button onClick={startAnimation} className="btn-neon btn-neon-green text-xs px-4 py-1.5">
                    ▶ ANIMATE
                  </button>
                ) : (
                  <button onClick={stopAnimation} className="btn-neon text-xs px-4 py-1.5" style={{ borderColor: '#ff4d4d', color: '#ff4d4d' }}>
                    ■ STOP
                  </button>
                )}
              </div>
            </div>

            {/* Sign cards grid */}
            <div className="flex flex-wrap gap-3 justify-center">
              {signs.map((sign, i) => (
                <div
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className="cursor-pointer"
                >
                  <SignCard
                    letter={sign.letter}
                    imageUrl={sign.imageUrl}
                    isActive={activeIdx === i}
                    isSpace={sign.isSpace}
                  />
                </div>
              ))}
            </div>

            {/* Active sign spotlight */}
            {activeIdx >= 0 && !signs[activeIdx]?.isSpace && (
              <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
                <span className="text-xs font-display text-gray-500 tracking-widest">CURRENT SIGN</span>
                <div className="w-48 h-48 rounded-xl overflow-hidden neon-border-green sign-card active">
                  {signs[activeIdx]?.imageUrl ? (
                    <img
                      src={signs[activeIdx].imageUrl}
                      alt={`ISL ${signs[activeIdx].letter}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl font-display font-bold text-[#00ff88]"
                        style={{ textShadow: '0 0 30px #00ff88' }}>
                        {signs[activeIdx]?.letter}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-3xl font-display font-bold text-[#00ff88]">
                  {signs[activeIdx]?.letter}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!signs.length && !isLoading && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="text-6xl opacity-20">✍️</div>
            <p className="text-gray-600 font-display text-xs tracking-widest">
              ENTER TEXT ABOVE TO SEE ISL SIGNS
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
