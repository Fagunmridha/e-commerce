import Link from 'next/link'

export function CpMarketHero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#f4f6f8]">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10 relative z-10 flex">
        {/* Text Content */}
        <div className="w-full md:w-1/2 py-16 md:py-24 lg:py-32 pr-4 lg:pr-12 text-left">
          <p className="text-indigo-600 font-semibold mb-4 text-sm tracking-wide">
            New Collection
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Latest Fashion For <br className="hidden md:block" /> Your Best Look
          </h1>
          <p className="text-gray-600 mb-8 max-w-md text-lg">
            High quality fashion for men, women and kids.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-8 py-3 rounded-md transition-colors shadow-lg shadow-indigo-500/30"
          >
            Shop Now
          </Link>
        </div>
      </div>
      
      {/* Image */}
      <div className="w-full md:absolute md:top-0 md:bottom-0 md:right-0 md:w-1/2 h-[400px] md:h-auto z-0">
        <img 
          src="/hero_clothing_rack.png" 
          alt="Premium Clothing Rack" 
          className="w-full h-full object-cover object-center md:object-right"
        />
      </div>
    </section>
  )
}


