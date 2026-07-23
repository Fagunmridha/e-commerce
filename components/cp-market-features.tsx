import { Truck, RotateCcw, ShieldCheck, HeadphonesIcon } from 'lucide-react'

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    desc: 'On all orders over $100',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    desc: '30 days return policy',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    desc: '100% secure payment',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    desc: 'Dedicated support',
  },
]

export function CpMarketFeatures() {
  return (
    <section className="bg-white border-b border-gray-100 py-8">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f6f8] text-indigo-500 shrink-0">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
