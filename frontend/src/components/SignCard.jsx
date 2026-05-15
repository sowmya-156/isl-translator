/**
 * SignCard - Displays an ISL sign image with the letter label.
 * Used in the Text-to-Sign page.
 */
import React, { useState } from 'react'

export default function SignCard({ letter, imageUrl, isActive = false, isSpace = false }) {
  const [imgError, setImgError] = useState(false)

  if (isSpace) {
    return (
      <div className="flex flex-col items-center justify-center w-24 h-28 rounded">
        <div className="w-12 h-12 flex items-center justify-center">
          <span className="text-gray-600 text-2xl">_</span>
        </div>
        <span className="mt-2 text-xs font-display text-gray-600">SPACE</span>
      </div>
    )
  }

  return (
    <div
      className={`sign-card flex flex-col items-center rounded overflow-hidden transition-all duration-300
        ${isActive ? 'active scale-110 z-10' : 'hover:scale-105'}`}
      style={{ width: '96px' }}
    >
      {/* Image */}
      <div className="w-full aspect-square bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={`ISL sign for ${letter}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          // Fallback: show letter as text
          <span
            className="text-4xl font-display font-bold"
            style={{
              color: isActive ? '#00ff88' : '#00f5ff',
              textShadow: `0 0 20px ${isActive ? '#00ff88' : '#00f5ff'}`,
            }}
          >
            {letter}
          </span>
        )}

        {/* Active glow overlay */}
        {isActive && (
          <div className="absolute inset-0 bg-[#00ff88]/10 border-2 border-[#00ff88]" />
        )}
      </div>

      {/* Label */}
      <div
        className="w-full text-center py-1 text-xs font-display tracking-widest"
        style={{ color: isActive ? '#00ff88' : '#aaa' }}
      >
        {letter}
      </div>
    </div>
  )
}
