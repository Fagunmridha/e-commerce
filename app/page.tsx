import { Navigation } from '@/components/navigation'
import { TransparencyBar } from '@/components/transparency-bar'
import { Hero } from '@/components/hero'
import { TrendingSection } from '@/components/trending-section'
import { UGCSection } from '@/components/ugc-section'

export default function Home() {
  return (
    <>
      <TransparencyBar />
      <Navigation />
      <main id="main-content">
        <Hero />
        <TrendingSection />
        <UGCSection />
      </main>
      <footer className="border-t border-border mt-20 bg-muted/30" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <nav>
              <h4 className="font-semibold text-foreground mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Men's Collection</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Women's Collection</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Accessories</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
              </ul>
            </nav>
            <nav>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQs</a></li>
              </ul>
            </nav>
            <nav>
              <h4 className="font-semibold text-foreground mb-4">About</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Our Story</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Sustainability</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </nav>
            <nav aria-label="Social media links">
              <h4 className="font-semibold text-foreground mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pinterest</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">TikTok</a></li>
              </ul>
            </nav>
          </div>
          <div className="border-t border-border pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2024 Luxe Sustainable. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
