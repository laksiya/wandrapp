import Header from '@/components/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              🌍 Travel Workspace
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload travel screenshots, extract activity details with AI, and organize your perfect 3-day itinerary
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/create"
                className="bg-primary-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                Create New Trip
              </a>
              <a
                href="/trip/seed-id"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
              >
                Try Demo Trip
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Smart Upload
            </h3>
            <p className="text-gray-600">
              Drop screenshots of activities, restaurants, and attractions. AI automatically extracts details.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🗂️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Activity Vault
            </h3>
            <p className="text-gray-600">
              All your activities organized in one place. Drag and drop to add them to your itinerary.
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              3-Day Calendar
            </h3>
            <p className="text-gray-600">
              Visual calendar to plan your perfect trip. Move, resize, and organize activities easily.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple 3-step process to create your perfect travel itinerary
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary-600 mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Screenshots
              </h3>
              <p className="text-gray-600">
                Drop images of activities, restaurants, or attractions you want to visit
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary-600 mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Extracts Details
              </h3>
              <p className="text-gray-600">
                Our AI automatically identifies activity names, types, and descriptions
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-primary-600 mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Plan Your Days
              </h3>
              <p className="text-gray-600">
                Drag activities to your calendar and organize the perfect 3-day itinerary
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Travel Workspace MVP - Powered by OpenAI Vision & Next.js 15
          </p>
        </div>
      </div>
    </div>
  )
}
