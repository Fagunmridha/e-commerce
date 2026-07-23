import Link from 'next/link'

const categories = [
  {
    title: "Men's Wear",
    items: '35 Items',
    href: '/men',
    img: '/cat_mens_wear.png',
  },
  {
    title: "Women's Wear",
    items: '42 Items',
    href: '/women',
    img: '/cat_womens_wear.png',
  },
  {
    title: "Kids Wear",
    items: '28 Items',
    href: '/kids',
    img: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&h=400&fit=crop&crop=faces',
  },
  {
    title: "Accessories",
    items: '18 Items',
    href: '/accessories',
    img: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=400&h=400&fit=crop',
  },
]

export function CpMarketCategories() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Top Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Link key={idx} href={cat.href} className="group relative overflow-hidden rounded-xl bg-[#f4f6f8] flex h-40 sm:h-48 transition-transform hover:-translate-y-1">
              <div className="p-6 flex flex-col justify-center z-10 w-3/5">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base">{cat.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{cat.items}</p>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/2 flex items-end justify-end">
                <img 
                  src={cat.img} 
                  alt={cat.title}
                  className="w-full h-full object-cover object-center rounded-r-xl"
                  style={{ maskImage: 'linear-gradient(to right, transparent, black 20%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 20%)' }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
