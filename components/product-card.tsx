import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Leaf, Award } from 'lucide-react'

export interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  badges: Array<'eco-friendly' | 'sustainable'>
}

export function ProductCard({ id, name, price, image, badges }: ProductCardProps) {
  return (
    <Link href={`/product/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image || "/placeholder.svg"}
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            {badges.includes('eco-friendly') && (
              <Badge className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                Eco-friendly
              </Badge>
            )}
            {badges.includes('sustainable') && (
              <Badge className="bg-accent hover:bg-accent/90 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Sustainable
              </Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 mb-2">
            {name}
          </h3>
          <p className="text-lg font-bold text-primary">
            ${price.toFixed(2)}
          </p>
        </div>
      </Card>
    </Link>
  )
}
