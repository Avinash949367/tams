export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-8">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="heading-responsive font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
          Monopoly Event
        </h1>
        <p className="text-responsive text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Experience the thrill of real-time Monopoly gameplay with interactive challenges, 
          team competition, and exciting rewards. Join the adventure today!
        </p>
      </div>

      {/* Feature Cards */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Register Card */}
          <a href="/register" className="group">
            <div className="card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Register Team
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                Create your team and join a venue to start playing. Choose your venue wisely!
              </p>
              <div className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Get Started →
              </div>
            </div>
          </a>

          {/* Play Card */}
          <a href="/play" className="group">
            <div className="card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Play Game
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                Wait for the dice roll and answer challenging questions in real-time.
              </p>
              <div className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Start Playing →
              </div>
            </div>
          </a>

          {/* Admin Card */}
          <a href="/admin" className="group">
            <div className="card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Admin Panel
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                Control dice rolls, manage questions, and evaluate team answers.
              </p>
              <div className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Manage Game →
              </div>
            </div>
          </a>

          {/* Seed Card */}
          <a href="/seed" className="group">
            <div className="card-hover bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Seed Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow">
                Add sample venues and questions to get started quickly.
              </p>
              <div className="mt-4 text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Setup Data →
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-16 w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">100+</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Players</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">50+</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Questions Available</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Real-time Gaming</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center animate-fade-in">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Adventure?</h2>
          <p className="text-purple-100 mb-6 max-w-md mx-auto">
            Join thousands of players in the most exciting Monopoly event ever created!
          </p>
          <a 
            href="/register" 
            className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors btn-animate"
          >
            Get Started Now
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
