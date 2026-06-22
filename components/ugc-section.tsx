import { Heart } from 'lucide-react'

interface UGCPost {
  id: string
  image: string
  likes: number
  username: string
}

const UGC_POSTS: UGCPost[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1495145904386-19be35b6a586?w=400&h=400&fit=crop',
    likes: 2341,
    username: '@sustainably_conscious',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1515991652487-9f007f7e7f18?w=400&h=400&fit=crop',
    likes: 1892,
    username: '@eco_fashionista',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1515739998095-d8f76b9e7c96?w=400&h=400&fit=crop',
    likes: 3127,
    username: '@minimal_style',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1506629082632-db45ff883048?w=400&h=400&fit=crop',
    likes: 2654,
    username: '@green_wardrobe',
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    likes: 1756,
    username: '@ethical_style',
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop',
    likes: 2891,
    username: '@sustainable_chic',
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1508412656886-a147f97b8f47?w=400&h=400&fit=crop',
    likes: 3342,
    username: '@conscious_living',
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1516762714899-e21cda11d229?w=400&h=400&fit=crop',
    likes: 2156,
    username: '@fashionably_green',
  },
]

export function UGCSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24" aria-label="Customer showcase gallery">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Customers in Motion
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          See how our community styles Luxe Sustainable pieces
        </p>
        <a
          href="https://instagram.com"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold"
        >
          Follow us @luxesustainable
          <span>→</span>
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4" role="region" aria-label="User-generated content gallery">
        {UGC_POSTS.map((post) => (
          <article
            key={post.id}
            className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
            role="img"
            aria-label={`Customer post with ${post.likes.toLocaleString()} likes from ${post.username}`}
          >
            <img
              src={post.image || "/placeholder.svg"}
              alt={`Customer post by ${post.username}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-white mb-2">
                  <Heart className="w-5 h-5 fill-white" />
                  <span className="font-semibold">{post.likes.toLocaleString()}</span>
                </div>
                <p className="text-sm text-white/90">{post.username}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
