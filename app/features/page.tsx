import Link from "next/link";

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">
                EV<span className="text-purple-400">Secure</span>
              </h1>
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/features" className="text-purple-400 font-semibold">
                Features
              </Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 animate-pulse" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Secure, Local
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Environment Variable Manager
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Store and manage your environment variables locally with client-side encryption
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How EVSecure Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A simple, secure workflow for managing your environment variables
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500">
                <span className="text-2xl font-bold text-purple-400">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Master Password</h3>
              <p className="text-sm text-gray-400">
                Set up your vault with a secure master password. This never leaves your browser.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-blue-500">
                <span className="text-2xl font-bold text-blue-400">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Variables</h3>
              <p className="text-sm text-gray-400">
                Add your API keys, secrets, and configs. They're encrypted instantly with AES-256-GCM.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500">
                <span className="text-2xl font-bold text-green-400">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Organize by Environment</h3>
              <p className="text-sm text-gray-400">
                Separate your development, staging, and production configs for easy management.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-500">
                <span className="text-2xl font-bold text-orange-400">4</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Export When Needed</h3>
              <p className="text-sm text-gray-400">
                Export decrypted .env files for use in your projects. Import existing files anytime.
              </p>
            </div>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Feature 1 - Client-Side Encryption */}
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
              <div className="bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Client-Side Encryption
              </h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                All encryption happens in your browser. Your secrets are encrypted with AES-256-GCM before being stored locally in IndexedDB.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>AES-256-GCM encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>PBKDF2 key derivation (100,000 iterations)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Unique IV for each encrypted value</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 - Local Storage */}
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
              <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                100% Local Storage
              </h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Everything stays in your browser. No servers, no cloud storage, no third-party access. Your data never leaves your machine.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Stored in browser IndexedDB</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No backend servers</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Complete privacy and control</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 - Environment Management */}
            <div className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
              <div className="bg-green-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Environment Management
              </h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Organize variables by environment. Default environments for development, staging, and production come pre-configured.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Pre-configured environments</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Color-coded for easy identification</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Separate configs per environment</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Additional Features
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Import/Export */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                <div className="bg-orange-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Import/Export</h3>
                <p className="text-sm text-gray-400">Import existing .env files or export your configs for use in projects</p>
              </div>

              {/* Cloud Sync - NEW */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white">
                    PRO
                  </span>
                </div>
                <div className="bg-indigo-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Cloud Sync</h3>
                <p className="text-sm text-gray-400">Sync your encrypted vault across devices with automatic backups</p>
              </div>

              {/* Show/Hide Values */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                <div className="bg-cyan-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Show/Hide Values</h3>
                <p className="text-sm text-gray-400">Toggle visibility of sensitive keys and values with one click for added security</p>
              </div>

              {/* Quick Copy */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                <div className="bg-pink-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Quick Copy</h3>
                <p className="text-sm text-gray-400">Copy keys or values to clipboard instantly for easy use in your projects</p>
              </div>
            </div>

            {/* Second row */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Edit & Delete */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                <div className="bg-yellow-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Edit & Delete</h3>
                <p className="text-sm text-gray-400">Update or remove variables anytime. Changes are re-encrypted automatically</p>
              </div>

              {/* Auto-lock */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                <div className="bg-red-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Auto-Lock</h3>
                <p className="text-sm text-gray-400">Automatically lock your vault after inactivity for enhanced security</p>
              </div>

              {/* Encrypted Backups */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30">
                <div className="bg-teal-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Encrypted Backups</h3>
                <p className="text-sm text-gray-400">Export encrypted backups that can only be restored with your master password</p>
              </div>

              {/* Multi-device Support */}
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/30 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-white">
                    PRO
                  </span>
                </div>
                <div className="bg-violet-500/10 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Multi-Device</h3>
                <p className="text-sm text-gray-400">Access your vault from any device with cloud sync enabled</p>
              </div>
            </div>
          </div>

          {/* Developer Guide Section - NEW */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              How to Use Your Exported .env Files
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              A quick guide for developers on integrating EVSecure exports into your projects
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Step 1 - Export */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-blue-500/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-blue-400">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Export from EVSecure</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Click "Export .env" on any environment to download your variables
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-500 mb-2"># Downloaded file: development.env</div>
                  <div className="text-green-400">DATABASE_URL=postgresql://...</div>
                  <div className="text-green-400">API_KEY=sk_test_...</div>
                  <div className="text-green-400">STRIPE_SECRET=sk_live_...</div>
                </div>
              </div>

              {/* Step 2 - Place in Project */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-purple-500/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-purple-400">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Rename & Place in Project</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Rename to <code className="bg-slate-900/50 px-2 py-0.5 rounded text-purple-400">.env.local</code> and place in your project root
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-xs">
                  <div className="text-gray-500 mb-1">your-project/</div>
                  <div className="text-gray-400 ml-4">├── src/</div>
                  <div className="text-gray-400 ml-4">├── public/</div>
                  <div className="text-green-400 ml-4">├── .env.local  ← Place here</div>
                  <div className="text-gray-400 ml-4">├── package.json</div>
                  <div className="text-gray-400 ml-4">└── next.config.js</div>
                </div>
              </div>

              {/* Step 3 - Add to .gitignore */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-red-500/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-red-400">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Add to .gitignore</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      ⚠️ <strong className="text-red-400">Critical:</strong> Never commit .env files to Git!, etc.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                  <div className="text-gray-500 mb-2"># .gitignore</div>
                  <div className="text-yellow-400">.env.local</div>
                  <div className="text-yellow-400">.env</div>
                  <div className="text-gray-500">node_modules/</div>
                  <div className="text-gray-500">.next/</div>
                </div>
              </div>

              {/* Step 4 - Access in Code */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-green-500/10 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-green-400">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Access in Your Code</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Use <code className="bg-slate-900/50 px-2 py-0.5 rounded text-green-400">process.env.VARIABLE_NAME</code>
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-xs">
                  <div className="text-gray-500">// Example: Next.js API route</div>
                  <div className="text-blue-400">const apiKey = </div>
                  <div className="text-green-400 ml-4">process.env.API_KEY;</div>
                  <div className="mt-2 text-gray-500">// Example: Database connection</div>
                  <div className="text-blue-400">const db = connect(</div>
                  <div className="text-green-400 ml-4">process.env.DATABASE_URL</div>
                  <div className="text-blue-400">);</div>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pro Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0">💡</span>
                  <span><strong className="text-white">Different files for different environments:</strong> Use <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-purple-400">.env.development</code>, <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-purple-400">.env.production</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0">🔒</span>
                  <span><strong className="text-white">Team collaboration:</strong> Share the template (<code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-purple-400">.env.example</code>), never the actual values</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0">☁️</span>
                  <span><strong className="text-white">Cloud deployments:</strong> Add variables directly in Vercel/Netlify dashboard, not in files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 flex-shrink-0">🔄</span>
                  <span><strong className="text-white">Keep EVSecure updated:</strong> When values change, update in EnvVault and re-export</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Security Info Section */}
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl p-8 border border-red-500/20 mb-20">
            <div className="flex items-start gap-4">
              <div className="bg-red-500/20 p-3 rounded-lg flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Important Security Notice</h3>
                <p className="text-gray-300 mb-3">
                  Your master password is the <strong>only</strong> way to decrypt your data. There is no password recovery option.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span>If you forget your master password, your encrypted data <strong>cannot be recovered</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Your data is only accessible in this browser with your master password</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Export your configs regularly as a backup</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl p-12 border border-purple-500/20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to secure your environment variables?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Keep your secrets safe with client-side encryption. No servers, no third parties, just you and your data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-purple-500/50 rounded-xl hover:bg-purple-500/10 text-white font-semibold transition-all duration-200 backdrop-blur-sm"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-12 bg-slate-950/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2026 EVSecure. Your secrets stay yours.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
