/**
 * App.jsx - Root component.
 * Sets up routing and global dark-mode state.
 */
import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import GesturePage from './pages/GesturePage.jsx'
import TextToSignPage from './pages/TextToSignPage.jsx'
import AboutPage from './pages/AboutPage.jsx'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gesture" element={<GesturePage />} />
          <Route path="/text-to-sign" element={<TextToSignPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </div>
  )
}
