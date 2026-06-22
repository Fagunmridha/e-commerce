import { Truck, Leaf } from 'lucide-react'

export function TransparencyBar() {
  return (
    <div className="bg-primary text-primary-foreground py-2 sm:py-3 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            <span>Free Shipping Worldwide</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-primary-foreground/30" />
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            <span>Carbon-Neutral Delivery</span>
          </div>
        </div>
      </div>
    </div>
  )
}
