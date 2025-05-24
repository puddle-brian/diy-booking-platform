export default function Register() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Book Yr Life</h1>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join the community</h2>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        {/* Account Type Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What type of account are you creating?
          </label>
          
          <div className="grid grid-cols-1 gap-3">
            <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 hover:bg-gray-50 focus:outline-none">
              <input type="radio" name="account-type" value="band" className="sr-only" />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🎵</div>
                  <div>
                    <div className="font-medium text-gray-900">Band / Artist</div>
                    <div className="text-sm text-gray-500">Looking to book venues and tour</div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border border-gray-300"></div>
              </div>
            </label>

            <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 hover:bg-gray-50 focus:outline-none">
              <input type="radio" name="account-type" value="venue" className="sr-only" />
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🏠</div>
                  <div>
                    <div className="font-medium text-gray-900">Venue Owner</div>
                    <div className="text-sm text-gray-500">Want to host shows and connect with artists</div>
                  </div>
                </div>
                <div className="h-4 w-4 rounded-full border border-gray-300"></div>
              </div>
            </label>
          </div>
        </div>

        {/* Registration Form */}
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-2">
                First name
              </label>
              <input
                id="first-name"
                name="first-name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-2">
                Last name
              </label>
              <input
                id="last-name"
                name="last-name"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Create a password"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="City, State/Province"
            />
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <a href="#" className="text-black hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-black hover:underline">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            Create account
          </button>
        </form>

        {/* Sign in link */}
        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/auth/login" className="text-black font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center pt-4">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
