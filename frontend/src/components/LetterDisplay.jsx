/**
 * LetterDisplay - Shows the currently detected letter with confidence bar.
 * Also shows the sentence being built.
 */
import React, { useEffect, useRef } from 'react'

export function DetectedLetter({ letter, confidence }) {
  const prevLetter = useRef(null)
  const letterRef = useRef(null)

  useEffect(() => {
    if (letter !== prevLetter.current && letter !== '?' && letterRef.current) {
      letterRef.current.classList.remove('letter-pop')
      void letterRef.current.offsetWidth // Force reflow
      letterRef.current.classList.add('letter-pop')
      prevLetter.current = letter
    }
  }, [letter])

  const confidencePercent = Math.round((confidence || 0) * 100)
  const color = confidencePercent > 75 ? '#00ff88' : confidencePercent > 50 ? '#ffee00' : '#ff6b6b'

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Big letter */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#00f5ff]/20" />
        <div
          className="absolute inset-2 rounded-full border border-[#00f5ff]/10"
          style={{
            boxShadow: letter && letter !== '?' ? `0 0 30px ${color}40` : 'none',
            borderColor: letter && letter !== '?' ? color + '40' : undefined
          }}
        />
        <span
          ref={letterRef}
          className="font-display text-7xl font-bold"
          style={{ color: letter && letter !== '?' ? color : '#333' }}
        >
          {letter || '—'}
        </span>
      </div>

      {/* Confidence */}
      <div className="w-full space-y-1">
        <div className="flex justify-between text-xs font-display">
          <span className="text-gray-500">CONFIDENCE</span>
          <span style={{ color }}>{confidencePercent}%</span>
        </div>
        <div className="h-1 bg-[#1a1a28] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${confidencePercent}%`,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function SentenceBuilder({ sentence, onClear, onSpeak, onBackspace }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-display text-gray-500 tracking-widest">SENTENCE</span>
        <div className="flex gap-2">
          <button
            onClick={onBackspace}
            className="btn-neon text-xs px-3 py-1"
            title="Backspace"
          >
            ⌫
          </button>
          <button onClick={onClear} className="btn-neon text-xs px-3 py-1">
            CLEAR
          </button>
        </div>
      </div>

      {/* Sentence display */}
      <div className="min-h-16 p-4 rounded neon-border-cyan bg-[#12121a] font-display text-lg tracking-widest">
        {sentence ? (
          <span className="text-white">
            {sentence.split('').map((char, i) => (
              <span
                key={i}
                className="inline-block transition-all"
                style={{ color: i === sentence.length - 1 ? '#00f5ff' : '#e8e8f0' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
            <span className="animate-pulse text-[#00f5ff]">|</span>
          </span>
        ) : (
          <span className="text-gray-600 text-sm font-body font-normal">
            Start making gestures to build a sentence...
          </span>
        )}
      </div>

      {/* Speak button */}
      <button
        onClick={onSpeak}
        disabled={!sentence.trim()}
        className="btn-neon-green btn-neon w-full py-3"
      >
        🔊 SPEAK SENTENCE
      </button>
    </div>
  )
}
