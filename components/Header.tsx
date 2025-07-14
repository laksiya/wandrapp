'use client'

import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  tripId?: string
  tripName?: string
  tripStartDate?: string
  tripEndDate?: string
}

export default function Header({ tripId, tripName, tripStartDate, tripEndDate }: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between h-auto py-2 gap-y-1">
          {/* Left: Globe, Trip Name, Date Range */}
          <div className="flex items-center min-w-0 space-x-2">
            <span className="text-2xl">🌍</span>
            {tripName && (
              <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {tripName}
              </span>
            )}
            {(tripStartDate || tripEndDate) && (
              <span className="text-xs sm:text-sm text-gray-500 ml-2 truncate">
                {tripStartDate && tripEndDate ? (
                  <>
                    {new Date(tripStartDate).toLocaleDateString()} - {new Date(tripEndDate).toLocaleDateString()}
                  </>
                ) : tripStartDate ? (
                  <>From {new Date(tripStartDate).toLocaleDateString()}</>
                ) : tripEndDate ? (
                  <>Until {new Date(tripEndDate).toLocaleDateString()}</>
                ) : null}
              </span>
            )}
          </div>

          {/* Right: Actions and Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4 mt-2 sm:mt-0">
            <div className="hidden sm:flex items-center space-x-2">
              <Link
                href="/"
                className="flex items-center px-2 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              <Link
                href="/create"
                className="flex items-center px-2 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Trip
              </Link>
            </div>
            {tripId && (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Trip URL copied to clipboard!')
                  }}
                  className="flex items-center px-2 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            )}
            {/* Mobile menu button */}
            <div className="relative sm:hidden">
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
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
