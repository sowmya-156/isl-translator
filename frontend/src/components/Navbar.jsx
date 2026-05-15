/**
 * Navbar - Top navigation with dark/light mode and route links.
 */

import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar({ darkMode, onToggleDark }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { path: '/', label: 'Home' },
    { path: '/gesture', label: 'Gesture → Text' },
    { path: '/text-to-sign', label: 'Text → Sign' },
    { path: '/about', label: 'About' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center neon-border-cyan">
              <span className="text-xs font-bold neon-text-cyan font-display">&#129304;</span>
            </div>
            <span className="font-display text-sm tracking-widest text-white hidden sm:block">
             HAND-TALK BRIDGE
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-xs font-display tracking-wider uppercase transition-all duration-200
                  ${location.pathname === link.path
                    ? 'text-[#00f5ff] border-b-2 border-[#00f5ff]'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleDark}
              className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all"
              title="Toggle theme"
            >
              {darkMode ? '☀' : '◐'}
            </button>
            {/* Status dot */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-display">
              <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
              LIVE
            </div>
            {/* Mobile menu */}
            <button
              className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-white transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#12121a]">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-6 py-3 text-xs font-display tracking-wider uppercase
                ${location.pathname === link.path ? 'text-[#00f5ff]' : 'text-gray-400'}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
