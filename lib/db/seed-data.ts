import type { Localized } from '@/lib/i18n'
import type { CategorySlug, ProductColor } from '@/lib/types'

/**
 * The initial catalogue. This file is the SOURCE used only by the seed script
 * (`pnpm db:seed`) — it never ships to the client. At runtime every product is
 * read from the database via lib/products.ts.
 */

export type SeedCategory = {
  slug: CategorySlug
  name: Localized
  image: string
}

export type SeedCatalogue = {
  slug: string
  categorySlug: CategorySlug
  name: Localized
  position: number
}

export type SeedProduct = {
  id: string
  name: Localized
  price: number
  oldPrice?: number
  image: string
  category: CategorySlug
  badge?: 'new' | 'sale'
  sizes?: string[]
  colors?: ProductColor[]
  description?: Localized
  stock: number
}

const u = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${w}&fit=crop&auto=format&q=75`

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    slug: 'men',
    name: { en: "Men's Wear", bn: 'পুরুষদের পোশাক' },
    image: u('1516257984-b1b4d707412e', 800),
  },
  {
    slug: 'women',
    name: { en: "Women's Wear", bn: 'নারীদের পোশাক' },
    image: u('1483985988355-763728e1935b', 800),
  },
  {
    slug: 'kids',
    name: { en: 'Kids Wear', bn: 'শিশুদের পোশাক' },
    image: u('1519238263530-99bdd11df2ea', 800),
  },
  {
    slug: 'accessories',
    name: { en: 'Accessories', bn: 'অ্যাক্সেসরিজ' },
    image: u('1590874103328-eac38a683ce7', 800),
  },
]

/**
 * The catalogue tree's second level. A starting set, not a fixed one — the
 * admin adds, renames and removes these from /admin/catalogues, and nothing in
 * the app assumes a particular slug exists.
 *
 * Accessories deliberately has none: the storefront hides the dropdown for a
 * category with no catalogues rather than showing an empty one, and that path
 * should be exercised by the seed rather than only discovered in production.
 */
export const SEED_CATALOGUES: SeedCatalogue[] = [
  { slug: 'jeans', categorySlug: 'men', name: { en: 'Jeans', bn: 'জিন্স' }, position: 0 },
  { slug: 'shirts', categorySlug: 'men', name: { en: 'Shirts', bn: 'শার্ট' }, position: 1 },
  { slug: 'panjabi', categorySlug: 'men', name: { en: 'Panjabi', bn: 'পাঞ্জাবি' }, position: 2 },
  { slug: 't-shirts', categorySlug: 'men', name: { en: 'T-Shirts', bn: 'টি-শার্ট' }, position: 3 },

  { slug: 'borka', categorySlug: 'women', name: { en: 'Borka', bn: 'বোরকা' }, position: 0 },
  { slug: 'three-piece', categorySlug: 'women', name: { en: 'Three-piece', bn: 'থ্রি-পিস' }, position: 1 },
  { slug: 'saree', categorySlug: 'women', name: { en: 'Saree', bn: 'শাড়ি' }, position: 2 },
  { slug: 'kurti', categorySlug: 'women', name: { en: 'Kurti', bn: 'কুর্তি' }, position: 3 },

  { slug: 'kids-boys', categorySlug: 'kids', name: { en: 'Boys', bn: 'ছেলেদের' }, position: 0 },
  { slug: 'kids-girls', categorySlug: 'kids', name: { en: 'Girls', bn: 'মেয়েদের' }, position: 1 },
  { slug: 'kids-baby', categorySlug: 'kids', name: { en: 'Baby', bn: 'শিশু' }, position: 2 },
]

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const KIDS_SIZES = ['2Y', '4Y', '6Y', '8Y', '10Y']

const COLOR = {
  grey: { name: { en: 'Grey', bn: 'ধূসর' }, hex: '#9ca3af' },
  black: { name: { en: 'Black', bn: 'কালো' }, hex: '#111827' },
  navy: { name: { en: 'Navy', bn: 'নেভি' }, hex: '#1b2a4a' },
  indigo: { name: { en: 'Indigo', bn: 'ইন্ডিগো' }, hex: '#3f4c8c' },
  washedBlue: { name: { en: 'Washed Blue', bn: 'হালকা নীল' }, hex: '#93b3d1' },
  white: { name: { en: 'White', bn: 'সাদা' }, hex: '#ffffff' },
  sky: { name: { en: 'Sky', bn: 'আকাশি' }, hex: '#7dd3fc' },
  sand: { name: { en: 'Sand', bn: 'বালু' }, hex: '#d8c3a5' },
  camel: { name: { en: 'Camel', bn: 'উটে রঙ' }, hex: '#c19a6b' },
  charcoal: { name: { en: 'Charcoal', bn: 'কালচে ধূসর' }, hex: '#36454f' },
  stone: { name: { en: 'Stone', bn: 'পাথুরে' }, hex: '#a8a29e' },
  olive: { name: { en: 'Olive', bn: 'জলপাই' }, hex: '#6b7f4b' },
  sage: { name: { en: 'Sage', bn: 'হালকা সবুজ' }, hex: '#b2c2a8' },
  cream: { name: { en: 'Cream', bn: 'ক্রিম' }, hex: '#f5f0e1' },
  blush: { name: { en: 'Blush', bn: 'হালকা গোলাপি' }, hex: '#e8bfc4' },
  ivory: { name: { en: 'Ivory', bn: 'হাতির দাঁত' }, hex: '#fffff0' },
  // No hex on purpose — a print has no single swatch colour. This is the
  // canonical reason `hex` is optional, and product 10 (`[COLOR.print]`) is the
  // live test case for the text-pill fallback.
  print: { name: { en: 'Print', bn: 'প্রিন্ট' } },
  yellow: { name: { en: 'Yellow', bn: 'হলুদ' }, hex: '#facc15' },
  red: { name: { en: 'Red', bn: 'লাল' }, hex: '#dc2626' },
  blue: { name: { en: 'Blue', bn: 'নীল' }, hex: '#2563eb' },
  tan: { name: { en: 'Tan', bn: 'হালকা বাদামি' }, hex: '#d2b48c' },
  gold: { name: { en: 'Gold', bn: 'সোনালি' }, hex: '#d4af37' },
  silver: { name: { en: 'Silver', bn: 'রুপালি' }, hex: '#c0c0c0' },
  brown: { name: { en: 'Brown', bn: 'বাদামি' }, hex: '#7b4b2a' },
} satisfies Record<string, ProductColor>

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: '1',
    name: { en: 'Classic Cotton Polo Shirt', bn: 'ক্লাসিক কটন পোলো শার্ট' },
    price: 5990,
    image: u('1586790170083-2f9ceadc732d'),
    category: 'men',
    badge: 'new',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.grey, COLOR.black, COLOR.navy],
    stock: 40,
    description: {
      en: 'A breathable pique cotton polo with a clean ribbed collar — an easy layer that works from desk to weekend.',
      bn: 'আরামদায়ক পিকে কটনের পোলো, পরিপাটি রিব কলারসহ — অফিস থেকে ছুটির দিন, সবখানেই মানানসই।',
    },
  },
  {
    id: '2',
    name: { en: 'Slim Fit Denim Jacket', bn: 'স্লিম ফিট ডেনিম জ্যাকেট' },
    price: 10790,
    oldPrice: 14390,
    image: u('1551028719-00167b16eac5'),
    category: 'men',
    badge: 'sale',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.indigo, COLOR.washedBlue],
    stock: 25,
    description: {
      en: 'Rigid selvedge-style denim with a tailored shoulder, built to fade beautifully with wear.',
      bn: 'শক্ত সেলভেজ-ধাঁচের ডেনিম, মাপা কাঁধ — যত পরবেন, রঙটা তত সুন্দর হয়ে উঠবে।',
    },
  },
  {
    id: '3',
    name: { en: 'Oxford Button-Down Shirt', bn: 'অক্সফোর্ড বাটন-ডাউন শার্ট' },
    price: 7190,
    image: u('1596755094514-f87e34085b2c'),
    category: 'men',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.white, COLOR.sky, COLOR.sand],
    stock: 33,
    description: {
      en: 'Mid-weight oxford cotton with a soft roll collar and a relaxed, tuck-friendly cut.',
      bn: 'মাঝারি ওজনের অক্সফোর্ড কটন, নরম রোল কলার আর আরামদায়ক কাট — সহজেই ইন করা যায়।',
    },
  },
  {
    id: '4',
    name: { en: 'Merino Wool Sweater', bn: 'মেরিনো উলের সোয়েটার' },
    price: 11990,
    oldPrice: 16790,
    image: u('1620799140408-edc6dcb6d633'),
    category: 'men',
    badge: 'sale',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.camel, COLOR.charcoal],
    stock: 18,
    description: {
      en: 'Fine-gauge merino that holds warmth without bulk. Wear it alone or under a coat.',
      bn: 'পাতলা বুননের মেরিনো উল — ভারী না হয়েও উষ্ণ। একা পরুন বা কোটের নিচে।',
    },
  },
  {
    id: '5',
    name: { en: 'Tailored Chino Trousers', bn: 'টেইলর্ড চিনো ট্রাউজার' },
    price: 8390,
    image: u('1473966968600-fa801b869a1a'),
    category: 'men',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.stone, COLOR.olive, COLOR.black],
    stock: 30,
    description: {
      en: 'A straight-leg chino in brushed twill with just enough stretch to move in.',
      bn: 'ব্রাশড টুইলের সোজা কাটের চিনো, হালকা স্ট্রেচসহ — চলাফেরায় স্বচ্ছন্দ।',
    },
  },
  {
    id: '6',
    name: { en: 'Linen Summer Dress', bn: 'লিনেন সামার ড্রেস' },
    price: 15590,
    image: u('1496747611176-843222e1e57c'),
    category: 'women',
    badge: 'new',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.sand, COLOR.sage, COLOR.white],
    stock: 22,
    description: {
      en: 'Airy washed linen with a gentle A-line drape — the easiest thing to reach for in July.',
      bn: 'হালকা ওয়াশড লিনেন, নরম এ-লাইন ড্রেপ — গরমের দিনে সবচেয়ে আরামের পছন্দ।',
    },
  },
  {
    id: '7',
    name: { en: 'Ribbed Knit Cardigan', bn: 'রিবড নিট কার্ডিগান' },
    price: 9590,
    oldPrice: 13190,
    image: u('1434389677669-e08b4cac3105'),
    category: 'women',
    badge: 'sale',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.cream, COLOR.blush, COLOR.black],
    stock: 27,
    description: {
      en: 'A soft ribbed cardigan with mother-of-pearl buttons and a slightly cropped hem.',
      bn: 'নরম রিব বুননের কার্ডিগান, ঝিনুকের বোতাম আর একটু ছোট হেমসহ।',
    },
  },
  {
    id: '8',
    name: {
      en: 'High-Waist Wide Leg Trousers',
      bn: 'হাই-ওয়েস্ট ওয়াইড লেগ ট্রাউজার',
    },
    price: 11390,
    image: u('1594633312681-425c7b97ccd1'),
    category: 'women',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.black, COLOR.ivory],
    stock: 19,
    description: {
      en: 'Fluid wide-leg trousers with a clean high waistband and a pressed front crease.',
      bn: 'ঝরঝরে ওয়াইড-লেগ ট্রাউজার, উঁচু কোমরবন্ধ আর সামনে ইস্ত্রি করা ভাঁজসহ।',
    },
  },
  {
    id: '9',
    name: { en: 'Oversized Cotton Blouse', bn: 'ওভারসাইজড কটন ব্লাউজ' },
    price: 7790,
    image: u('1485462537746-965f33f7f6a7'),
    category: 'women',
    badge: 'new',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.white, COLOR.sky],
    stock: 24,
    description: {
      en: 'A relaxed poplin blouse with dropped shoulders and a hidden placket.',
      bn: 'ঢিলেঢালা পপলিন ব্লাউজ, নামানো কাঁধ আর লুকানো প্ল্যাকেটসহ।',
    },
  },
  {
    id: '10',
    name: { en: 'Floral Midi Skirt', bn: 'ফ্লোরাল মিডি স্কার্ট' },
    price: 8990,
    oldPrice: 11990,
    image: u('1572804013309-59a88b7e92f1'),
    category: 'women',
    badge: 'sale',
    sizes: DEFAULT_SIZES,
    colors: [COLOR.print],
    stock: 21,
    description: {
      en: 'A bias-cut midi with a soft floral print that moves as you walk.',
      bn: 'বায়াস-কাট মিডি স্কার্ট, নরম ফুলেল প্রিন্ট — হাঁটার সাথে সুন্দরভাবে দোলে।',
    },
  },
  {
    id: '11',
    name: { en: 'Kids Graphic T-Shirt', bn: 'শিশুদের গ্রাফিক টি-শার্ট' },
    price: 2990,
    image: u('1519278409-1f56fdda7fe5'),
    category: 'kids',
    badge: 'new',
    sizes: KIDS_SIZES,
    colors: [COLOR.yellow, COLOR.white, COLOR.red],
    stock: 60,
    description: {
      en: 'Soft combed cotton with a print that survives the wash — and the playground.',
      bn: 'নরম কম্বড কটন, এমন প্রিন্ট যা ধোয়ার পরও টেকে — খেলার মাঠেও।',
    },
  },
  {
    id: '12',
    name: { en: 'Kids Hooded Sweatshirt', bn: 'শিশুদের হুডেড সোয়েটশার্ট' },
    price: 4790,
    image: u('1622290291468-a28f7a7dc6a8'),
    category: 'kids',
    sizes: KIDS_SIZES,
    colors: [COLOR.grey, COLOR.navy],
    stock: 35,
    description: {
      en: 'A brushed-back fleece hoodie with a kangaroo pocket and roomy sleeves.',
      bn: 'ভেতরে ব্রাশ করা ফ্লিস হুডি, ক্যাঙ্গারু পকেট আর ঢিলেঢালা হাতাসহ।',
    },
  },
  {
    id: '13',
    name: { en: 'Kids Denim Overalls', bn: 'শিশুদের ডেনিম ওভারঅল' },
    price: 5390,
    oldPrice: 7190,
    image: u('1503944583220-79d8926ad5e2'),
    category: 'kids',
    badge: 'sale',
    sizes: ['2Y', '4Y', '6Y', '8Y'],
    colors: [COLOR.blue],
    stock: 28,
    description: {
      en: 'Adjustable straps, reinforced knees, and pockets for whatever gets collected.',
      bn: 'অ্যাডজাস্টেবল স্ট্র্যাপ, মজবুত হাঁটু আর পকেট — যা কিছু কুড়িয়ে আনে, সব রাখার জন্য।',
    },
  },
  {
    id: '14',
    name: { en: 'Leather Shoulder Bag', bn: 'চামড়ার শোল্ডার ব্যাগ' },
    price: 17990,
    image: u('1548036328-c9fa89d128fa'),
    category: 'accessories',
    badge: 'new',
    colors: [COLOR.tan, COLOR.black],
    stock: 15,
    description: {
      en: 'Full-grain leather with a suede-lined interior and an adjustable webbing strap.',
      bn: 'ফুল-গ্রেইন চামড়া, ভেতরে সুয়েড লাইনিং আর অ্যাডজাস্টেবল স্ট্র্যাপ।',
    },
  },
  {
    id: '15',
    name: { en: 'Classic Aviator Sunglasses', bn: 'ক্লাসিক অ্যাভিয়েটর সানগ্লাস' },
    price: 10790,
    oldPrice: 14390,
    image: u('1511499767150-a48a237f0083'),
    category: 'accessories',
    badge: 'sale',
    colors: [COLOR.gold, COLOR.silver],
    stock: 32,
    description: {
      en: 'Thin metal frames with polarised lenses and adjustable nose pads.',
      bn: 'পাতলা ধাতব ফ্রেম, পোলারাইজড লেন্স আর অ্যাডজাস্টেবল নোজ প্যাড।',
    },
  },
  {
    id: '16',
    name: { en: 'Woven Leather Belt', bn: 'বোনা চামড়ার বেল্ট' },
    price: 6590,
    image: u('1624222247344-550fb60583dc'),
    category: 'accessories',
    sizes: ['S', 'M', 'L'],
    colors: [COLOR.brown, COLOR.black],
    stock: 45,
    description: {
      en: 'A hand-woven leather belt with a brushed brass buckle that ages well.',
      bn: 'হাতে বোনা চামড়ার বেল্ট, ব্রাশড ব্রাস বাকলসহ — সময়ের সাথে আরও সুন্দর হয়।',
    },
  },
]
