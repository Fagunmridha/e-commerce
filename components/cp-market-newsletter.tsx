export function CpMarketNewsletter() {
  return (
    <section className="bg-indigo-50/50 py-20 border-b border-gray-200">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10 flex flex-col items-center text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Join Our Newsletter
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
        </p>
        <form className="flex w-full max-w-md flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
            required
          />
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-md shadow-indigo-500/20"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}
