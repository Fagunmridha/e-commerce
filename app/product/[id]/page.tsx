'use client'

import { useState } from 'react'
import { ChevronDown, Share2, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ProductImage {
  url: string
  alt: string
}

interface ProductVariant {
  size: string
  inStock: boolean
}

const PRODUCT_IMAGES: ProductImage[] = [
  {
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    alt: 'Product front view',
  },
  {
    url: 'https://images.unsplash.com/photo-1595777707802-41d339d60280?w=800&h=800&fit=crop',
    alt: 'Product side view',
  },
  {
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop',
    alt: 'Product detail view',
  },
  {
    url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    alt: 'Product back view',
  },
]

const SIZES: ProductVariant[] = [
  { size: 'XS', inStock: true },
  { size: 'S', inStock: true },
  { size: 'M', inStock: true },
  { size: 'L', inStock: true },
  { size: 'XL', inStock: false },
  { size: 'XXL', inStock: true },
]

const COLORS = ['Oat', 'Black', 'Sage', 'Clay']

export default function ProductPage({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState('Oat')
  const [isFavorited, setIsFavorited] = useState(false)
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-product" className="sr-only focus:not-sr-only">
        Skip to product details
      </a>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Desktop Layout */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12" role="main" id="main-product">
          {/* Gallery Section */}
          <div className="space-y-4">
            {/* 3D Viewer Placeholder */}
            <div className="aspect-square rounded-xl overflow-hidden bg-muted relative group">
              <img
                src={PRODUCT_IMAGES[selectedImage].url || "/placeholder.svg"}
                alt={PRODUCT_IMAGES[selectedImage].alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
                <span className="text-xs text-muted-foreground bg-background/90 backdrop-blur px-3 py-1.5 rounded-full">
                  3D Model Available
                </span>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {PRODUCT_IMAGES.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Title & Badges */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                    Organic Cotton Oversized Tee
                  </h1>
                  <div className="flex gap-2">
                    <Badge className="bg-green-600">Eco-friendly</Badge>
                    <Badge className="bg-accent">Sustainable</Badge>
                  </div>
                </div>
                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`p-3 rounded-lg border transition-all ${
                    isFavorited
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border hover:border-primary text-muted-foreground'
                  }`}
                  aria-label="Add to favorites"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              <p className="text-2xl font-bold text-primary">$89.99</p>
              <p className="text-sm text-muted-foreground mt-2">
                Free shipping on all orders
              </p>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                Crafted from 100% certified organic cotton, this oversized tee embodies
                sustainable luxury. The relaxed fit and premium fabric weight ensure
                all-day comfort without compromising on style.
              </p>
              <details className="cursor-pointer">
                <summary className="font-semibold text-foreground flex items-center gap-2 py-2">
                  <ChevronDown className="w-4 h-4" />
                  Sustainability Story
                </summary>
                <div className="pt-3 text-sm text-muted-foreground space-y-2">
                  <p>
                    • 100% GOTS-certified organic cotton from Indian fair-trade farms
                  </p>
                  <p>• Carbon-neutral dyeing process</p>
                  <p>• Recyclable packaging made from 100% recycled materials</p>
                  <p>• Zero-waste production facility</p>
                </div>
              </details>
            </div>

            {/* Color Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                Color: {selectedColor}
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`aspect-square rounded-lg border-2 font-medium text-sm transition-all ${
                      selectedColor === color
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">
                Size: {selectedSize}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SIZES.map(({ size, inStock }) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    disabled={!inStock}
                    className={`py-3 rounded-lg border-2 font-medium transition-all ${
                      selectedSize === size
                        ? 'border-primary bg-primary/10'
                        : inStock
                          ? 'border-border hover:border-primary'
                          : 'border-border bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <a
                href="#"
                className="text-sm text-primary hover:underline inline-block"
              >
                Size Guide
              </a>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">Quantity</label>
              <div className="flex items-center gap-3 w-fit border border-border rounded-lg p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-muted rounded transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 hover:bg-muted rounded transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Bag - Sticky on Mobile */}
            <div className="space-y-2 sticky bottom-0 sm:static bg-background/95 sm:bg-transparent -mx-4 sm:mx-0 px-4 sm:px-0 py-4 sm:py-0 border-t sm:border-0 border-border">
              <Button size="lg" className="w-full h-12 text-base">
                Add to Bag
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 text-base flex items-center justify-center gap-2 bg-transparent"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-20 border-t border-border pt-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Care Instructions</h3>
              <ul className="text-muted-foreground space-y-2 text-sm">
                <li>• Wash in cold water with like colors</li>
                <li>• Use eco-friendly detergent</li>
                <li>• Dry flat or hang dry for best results</li>
                <li>• Avoid bleach and fabric softener</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Specifications</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Material</span>
                  <span className="text-foreground font-semibold">100% Organic Cotton</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight</span>
                  <span className="text-foreground font-semibold">180 GSM</span>
                </div>
                <div className="flex justify-between">
                  <span>Fit</span>
                  <span className="text-foreground font-semibold">Oversized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
