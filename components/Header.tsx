'use client'

import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  tripId?: string
  tripName?: string
}

export default function Header({ tripId, tripName }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌍</span>
              <h1 className="text-xl font-bold text-gray-900">
                Travel Workspace
              </h1>
            </Link>
            {tripName && (
              <div className="ml-4 pl-4 border-l border-gray-300">
                <span className="text-gray-600 text-sm">Trip:</span>
                <span className="ml-1 font-semibold text-gray-900">{tripName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {tripId && (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-500">Share:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Trip URL copied to clipboard!')
                  }}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
                >
                  Copy Link
                </button>
              </div>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/create"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Create New Trip
                    </Link>
                    <Link
                      href="/"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      Home
                    </Link>
                    {tripId && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          alert('Trip URL copied!')
                          setShowMenu(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden"
                      >
                        Copy Trip Link
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
