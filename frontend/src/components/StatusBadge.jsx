/**
 * StatusBadge - Shows backend connection status, camera status etc.
 */
import React from 'react'

export function StatusBadge({ status, label }) {
  const colors = {
    ok: '#00ff88',
    error: '#ff4d4d',
    loading: '#ffee00',
    idle: '#666',
  }
  const color = colors[status] || colors.idle

  return (
    <div className="flex items-center gap-2 text-xs font-display tracking-wider">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span style={{ color }}>{label}</span>
    </div>
  )
}

export function LoadingSpinner({ size = 'md', color = '#00f5ff' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div
      className={`${sizes[size]} rounded-full border-2 border-transparent animate-spin`}
      style={{
        borderTopColor: color,
        borderRightColor: color + '40',
      }}
    />
  )
}

export function ErrorBox({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded border border-red-500/40 bg-red-500/10">
      <span className="text-red-400 text-lg mt-0.5">⚠</span>
      <div className="flex-1">
        <p className="text-red-300 text-sm font-display">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-white text-xs">✕</button>
      )}
    </div>
  )
}
