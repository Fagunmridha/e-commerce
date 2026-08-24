import type { Locale } from '@/lib/i18n'

/**
 * The store’s legal pages — shipping, returns, privacy and terms.
 *
 * They live here rather than in `lib/dictionaries.ts` for one reason: volume.
 * Four documents in two languages is more text than the rest of the site’s copy
 * put together, and burying it in the dictionary would make that file unusable.
 * The shape is deliberately plain — a list of numbered sections, each with
 * paragraphs, an optional bullet list and an optional closing caveat — because
 * every one of these documents is written that way, and a renderer that only
 * understands those three things cannot be given markup it will not honour.
 */

export const POLICY_SLUGS = ['shipping', 'returns', 'privacy', 'terms'] as const

export type PolicySlug = (typeof POLICY_SLUGS)[number]

export type PolicySection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  /** A caveat rendered in a tinted box after the body — the "may not apply" line. */
  note?: string
}

export type PolicyDoc = {
  title: string
  breadcrumb: string
  /** Also the meta description, so keep it to one sentence. */
  description: string
  updated: string
  intro: string
  sections: PolicySection[]
}

/** Where each document is served. Used by the footer and the cross-links. */
export const POLICY_PATHS: Record<PolicySlug, string> = {
  shipping: '/shipping-policy',
  returns: '/return-policy',
  privacy: '/privacy-policy',
  terms: '/terms',
}

const en: Record<PolicySlug, PolicyDoc> = {
  shipping: {
    title: 'Shipping Policy',
    breadcrumb: 'Shipping Policy',
    description:
      'How we process, ship and deliver your order anywhere in Bangladesh.',
    updated: 'Last updated: 16 August 2026',
    intro:
      'At CP Market, we aim to deliver your order safely, accurately, and as quickly as possible.',
    sections: [
      {
        title: 'Delivery Areas',
        paragraphs: [
          'We currently deliver orders across Bangladesh through our designated delivery partners.',
        ],
      },
      {
        title: 'Order Processing',
        paragraphs: [
          'Orders are generally processed within 1–2 business days after order confirmation.',
          'Orders may take additional time during holidays, promotional campaigns, or periods of high order volume.',
        ],
      },
      {
        title: 'Estimated Delivery Time',
        paragraphs: ['Typical delivery times are:'],
        bullets: [
          'Inside Dhaka: 1–2 business days',
          'Outside Dhaka: 1–2 business days',
        ],
        note: 'Delivery times are estimates and may vary depending on location, weather, public holidays, courier conditions, or other circumstances beyond our control.',
      },
      {
        title: 'Shipping Charges',
        paragraphs: [
          'Delivery charges are calculated based on the delivery location, order size, weight, and applicable courier charges.',
          'The applicable delivery charge will be shown or communicated before the order is confirmed.',
        ],
      },
      {
        title: 'Order Confirmation',
        paragraphs: [
          'After placing an order, our team may contact you by phone or other available communication methods to confirm the order and delivery details.',
          'An order may not be processed until the required information has been confirmed.',
        ],
      },
      {
        title: 'Tracking Your Order',
        paragraphs: [
          'Where tracking information is available, customers may receive the relevant tracking details through the contact information provided during checkout.',
        ],
      },
      {
        title: 'Delivery Attempts',
        paragraphs: [
          'Our delivery partner may make delivery attempts using the phone number and address provided by the customer.',
          'Customers are requested to remain available and provide accurate contact and delivery information.',
        ],
        note: 'If delivery fails because of an incorrect address, an unavailable recipient, or an inability to contact the customer, additional delivery charges may apply for another delivery attempt.',
      },
      {
        title: 'Delayed or Lost Orders',
        paragraphs: [
          'Although we work with trusted delivery partners, unexpected delays may occur.',
          'If your order appears to be significantly delayed or lost, please contact CP Market customer support so that we can investigate the matter with the relevant delivery partner.',
        ],
      },
      {
        title: 'Damaged Package',
        paragraphs: [
          'If you receive a package that appears seriously damaged, please contact us as soon as possible and provide photographs or video evidence where applicable.',
          'We will review the issue and assist you according to our Return & Refund Policy.',
        ],
      },
      {
        title: 'Incorrect Delivery Information',
        paragraphs: ['Customers are responsible for providing accurate:'],
        bullets: [
          'Name',
          'Phone number',
          'Delivery address',
          'Area and postal information',
        ],
        note: 'CP Market may not be responsible for delivery problems caused by incorrect or incomplete information provided by the customer.',
      },
    ],
  },

  returns: {
    title: 'Return & Refund Policy',
    breadcrumb: 'Return Policy',
    description:
      'When a product can be returned or replaced, and how the refund works.',
    updated: 'Last updated: 16 August 2026',
    intro:
      'At CP Market, we want you to shop with confidence. If you receive a product that is damaged, defective, incorrect, or significantly different from what you ordered, you may request a return or replacement according to the conditions below.',
    sections: [
      {
        title: 'Eligibility for Return',
        paragraphs: ['A return or replacement request may be accepted when:'],
        bullets: [
          'You receive a damaged or defective product.',
          'You receive a different product from the one you ordered.',
          'You receive an incorrect size, colour, or variant due to our error.',
          'The product has a significant quality issue that was not disclosed in the product description.',
        ],
      },
      {
        title: 'Return Time',
        paragraphs: [
          'You must contact us within 3 days of receiving the product to request a return or replacement.',
        ],
        note: 'Requests made after this period may not be accepted.',
      },
      {
        title: 'Product Condition',
        paragraphs: ['To be eligible for a return:'],
        bullets: [
          'The product must be unused and unworn.',
          'Original tags, packaging, and accessories should remain intact.',
          'The product must not be washed, altered, damaged, or used.',
          'Proof of purchase or order information may be required.',
        ],
      },
      {
        title: 'Non-Returnable Items',
        paragraphs: [
          'Certain products may not be eligible for return due to their nature, including:',
        ],
        bullets: [
          'Used or worn products',
          'Washed or altered products',
          'Products damaged after delivery due to customer handling',
          'Products without required tags or original packaging',
          'Products clearly marked as Final Sale / Non-Returnable',
        ],
      },
      {
        title: 'Return Process',
        paragraphs: [
          'To request a return, contact our customer support with:',
        ],
        bullets: [
          'Order number',
          'Customer name',
          'Phone number',
          'Reason for return',
          'Clear photos or video of the product, if applicable',
        ],
        note: 'Our team will review the request and provide further instructions.',
      },
      {
        title: 'Return Shipping',
        paragraphs: [
          'If the return is due to an error on our part, such as receiving a wrong, defective, or damaged product, CP Market may bear the applicable return delivery cost.',
          'For other approved returns, return delivery charges may be the customer’s responsibility.',
        ],
      },
      {
        title: 'Exchange',
        paragraphs: [
          'Where applicable, an eligible product may be exchanged for another available size, colour, or product.',
          'If the requested replacement is unavailable, we may offer an alternative solution or refund according to the circumstances.',
        ],
      },
      {
        title: 'Refund',
        paragraphs: [
          'Once the returned product has been received and inspected, we will confirm whether the refund is approved.',
          'Approved refunds will be processed through the applicable payment method or another agreed method.',
        ],
        note: 'Refund processing time may vary depending on the payment provider or financial institution.',
      },
      {
        title: 'Order Cancellation',
        paragraphs: [
          'You may request cancellation before your order has been processed or shipped.',
          'Once an order has been shipped, cancellation may no longer be possible and the standard return policy may apply.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    breadcrumb: 'Privacy Policy',
    description:
      'What information we collect, how we use it, and the choices you have.',
    updated: 'Last updated: 16 August 2026',
    intro:
      'At CP Market, your privacy is important to us. This Privacy Policy explains how we collect, use, protect, and manage your information when you visit or use our website, cauyapauya.com.',
    sections: [
      {
        title: 'Information We Collect',
        paragraphs: [
          'When you use our website, place an order, create an account, or contact us, we may collect information such as:',
        ],
        bullets: [
          'Name',
          'Phone number',
          'Email address',
          'Billing and delivery address',
          'Order and transaction details',
          'Account information',
          'Information you provide through our contact forms or customer support',
        ],
        note: 'We may also collect certain technical information, such as your IP address, browser type, device information, and website usage data.',
      },
      {
        title: 'How We Use Your Information',
        paragraphs: ['We may use your information to:'],
        bullets: [
          'Process and deliver your orders',
          'Confirm and manage payments',
          'Provide customer support',
          'Communicate with you about your orders',
          'Improve our products, services, and website',
          'Maintain website security',
          'Prevent fraud or unauthorised activity',
          'Send updates, offers, or promotional communications where permitted',
        ],
      },
      {
        title: 'Payment Information',
        paragraphs: [
          'Payments may be processed through trusted third-party payment providers. CP Market does not unnecessarily store sensitive payment information such as complete card numbers or security codes.',
        ],
      },
      {
        title: 'Cookies',
        paragraphs: [
          'Our website may use cookies and similar technologies to improve website functionality, remember preferences, understand website usage, and provide a better shopping experience.',
          'You can control or disable cookies through your browser settings, although some website features may not function properly as a result.',
        ],
      },
      {
        title: 'Sharing of Information',
        paragraphs: [
          'We do not sell or rent your personal information.',
          'We may share necessary information with trusted service providers when required to operate our business, such as payment processors, delivery partners, hosting providers, or technical service providers.',
          'We may also disclose information when required by law or when necessary to protect our rights, users, or website.',
        ],
      },
      {
        title: 'Data Security',
        paragraphs: [
          'We take reasonable technical and organisational measures to protect your personal information from unauthorised access, misuse, alteration, disclosure, or loss.',
        ],
        note: 'However, no online transmission or electronic storage system can be guaranteed to be completely secure.',
      },
      {
        title: 'Your Choices',
        paragraphs: ['You may contact us to:'],
        bullets: [
          'Request information about the personal data we hold about you',
          'Request correction of inaccurate information',
          'Request deletion of information where applicable',
          'Ask questions about how your information is used',
          'Opt out of certain promotional communications',
        ],
      },
      {
        title: 'Third-Party Links',
        paragraphs: [
          'Our website may contain links to third-party websites or services. CP Market is not responsible for the privacy practices or content of those external websites.',
          'We recommend reviewing their privacy policies before providing personal information.',
        ],
      },
      {
        title: 'Children’s Privacy',
        paragraphs: [
          'Our website is not intended to knowingly collect personal information from children without appropriate consent. If we become aware that personal information has been collected improperly, we will take reasonable steps to address the situation.',
        ],
      },
      {
        title: 'Changes to This Privacy Policy',
        paragraphs: [
          'We may update this Privacy Policy from time to time to reflect changes in our services, technology, or legal requirements.',
          'Any updated version will be published on this page with a revised “last updated” date.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    breadcrumb: 'Terms & Conditions',
    description:
      'The terms that apply when you browse cauyapauya.com or place an order with us.',
    updated: 'Last updated: 19 August 2026',
    intro:
      'These Terms & Conditions govern your use of cauyapauya.com and any order you place with CP Market. By browsing the website or placing an order, you agree to the terms set out below.',
    sections: [
      {
        title: 'Acceptance of Terms',
        paragraphs: [
          'By accessing our website, creating an account, or placing an order, you confirm that you have read and accepted these Terms & Conditions along with our Privacy Policy, Shipping Policy, and Return & Refund Policy.',
          'If you do not agree with any part of these terms, please do not use the website or place an order.',
        ],
      },
      {
        title: 'Eligibility and Accounts',
        paragraphs: [
          'You must be able to enter into a valid contract under applicable law to place an order with us.',
          'If you create an account, you are responsible for keeping your login details secure and for any activity carried out through your account. Please inform us immediately if you believe your account has been used without your permission.',
        ],
      },
      {
        title: 'Products and Availability',
        paragraphs: [
          'We take care to describe our products accurately, but colours, textures, and measurements may appear slightly different depending on your screen and on normal variations in fabric and production.',
          'All products are subject to availability. If an item becomes unavailable after you order it, we may contact you to arrange a replacement, a partial delivery, or a cancellation of that item.',
        ],
      },
      {
        title: 'Pricing',
        paragraphs: [
          'All prices are shown in Bangladeshi Taka (BDT) and may be changed at any time without prior notice. The price that applies to your order is the price shown when the order is confirmed.',
          'Delivery charges are additional and are shown or communicated before your order is confirmed.',
        ],
        note: 'If an obvious pricing or typing error is found in an order, we may contact you to correct it or cancel the affected order before it is shipped.',
      },
      {
        title: 'Orders and Order Confirmation',
        paragraphs: [
          'Placing an order is an offer to purchase. An order is treated as accepted only after we confirm it, and our team may contact you by phone or another available method to confirm your order and delivery details.',
          'We may decline or cancel an order where the product is unavailable, the provided information is incomplete or incorrect, or where we reasonably suspect fraudulent or abusive activity.',
        ],
      },
      {
        title: 'Payment',
        paragraphs: [
          'Orders are payable by cash on delivery unless another payment method is expressly offered for your order at checkout.',
          'For cash on delivery, the full amount, including delivery charges, must be paid to our delivery partner at the time of delivery.',
        ],
      },
      {
        title: 'Shipping and Delivery',
        paragraphs: [
          'Processing times, delivery estimates, delivery charges, and our handling of delayed, failed, or damaged deliveries are described in our Shipping Policy, which forms part of these terms.',
        ],
      },
      {
        title: 'Cancellation, Return and Refund',
        paragraphs: [
          'You may request cancellation before your order has been processed or shipped. Eligibility for returns, replacements, and refunds is described in our Return & Refund Policy, which forms part of these terms.',
        ],
      },
      {
        title: 'Coupons and Promotions',
        paragraphs: [
          'Discount codes, campaigns, and promotional offers may carry their own conditions, such as a minimum order value, a validity period, selected products, or a usage limit per customer.',
          'We may withdraw or modify an offer at any time, and we may cancel a discount that has been obtained through misuse or through repeated cancelled or undelivered orders.',
        ],
      },
      {
        title: 'Wholesale and Seller Accounts',
        paragraphs: [
          'Wholesale access is granted only after an application has been reviewed and approved by us, and approval may be suspended or withdrawn where the agreed conditions are not met.',
          'Sellers listing products through our platform are responsible for the accuracy of their listings, the quality and legality of their stock, and for fulfilling accepted orders. Applicable commission and settlement terms are those shown in the seller dashboard at the time of the sale.',
        ],
      },
      {
        title: 'Reviews and User Content',
        paragraphs: [
          'Product reviews, ratings, and messages you submit must be your own and must not contain unlawful, misleading, offensive, or infringing content.',
          'We may publish, decline to publish, or remove submitted content, and we may use it in connection with the operation and promotion of our store.',
        ],
      },
      {
        title: 'Acceptable Use',
        paragraphs: [
          'You agree not to use our website in a way that damages, disables, or overburdens it, attempts to gain unauthorised access to any part of it, or interferes with another customer’s use of it.',
          'Collecting data from the website by automated means without our permission, or reselling our content, is not permitted.',
        ],
      },
      {
        title: 'Intellectual Property',
        paragraphs: [
          'The CP Market name, logo, website design, text, graphics, and product photography are owned by or licensed to CP Market and are protected by applicable law.',
          'You may not copy, reproduce, or use them for commercial purposes without our prior written permission.',
        ],
      },
      {
        title: 'Third-Party Links and Services',
        paragraphs: [
          'Our website may link to or rely on third-party services such as payment providers, delivery partners, and social platforms. We are not responsible for the content, policies, or performance of those third parties.',
        ],
      },
      {
        title: 'Limitation of Liability',
        paragraphs: [
          'We provide our website and services with reasonable care, but we do not guarantee that the website will always be available, uninterrupted, or free of errors.',
          'To the extent permitted by law, our liability in connection with an order is limited to the value of that order.',
        ],
      },
      {
        title: 'Privacy',
        paragraphs: [
          'Information you provide to us is handled in accordance with our Privacy Policy, which explains what we collect, how it is used, and the choices available to you.',
        ],
      },
      {
        title: 'Changes to These Terms',
        paragraphs: [
          'We may update these Terms & Conditions from time to time to reflect changes in our services, technology, or legal requirements. The updated version will be published on this page with a revised “last updated” date.',
          'The terms that apply to your order are the ones published at the time the order is placed.',
        ],
      },
      {
        title: 'Governing Law',
        paragraphs: [
          'These Terms & Conditions are governed by the laws of Bangladesh, and any dispute arising from them will be subject to the jurisdiction of the courts of Bangladesh.',
        ],
      },
    ],
  },
}

const bn: Record<PolicySlug, PolicyDoc> = {
  shipping: {
    title: 'শিপিং পলিসি',
    breadcrumb: 'শিপিং পলিসি',
    description:
      'আপনার অর্ডার কীভাবে প্রসেস, শিপ এবং সারা বাংলাদেশে ডেলিভারি করা হয়।',
    updated: 'সর্বশেষ হালনাগাদ: ১৬ আগস্ট ২০২৬',
    intro:
      'CP Market–এ আমরা আপনার অর্ডার নিরাপদে, সঠিকভাবে এবং যত দ্রুত সম্ভব পৌঁছে দিতে চাই।',
    sections: [
      {
        title: 'ডেলিভারি এলাকা',
        paragraphs: [
          'আমরা বর্তমানে আমাদের নির্ধারিত ডেলিভারি পার্টনারের মাধ্যমে সারা বাংলাদেশে অর্ডার ডেলিভারি করি।',
        ],
      },
      {
        title: 'অর্ডার প্রসেসিং',
        paragraphs: [
          'অর্ডার নিশ্চিত হওয়ার পর সাধারণত ১–২ কার্যদিবসের মধ্যে অর্ডার প্রসেস করা হয়।',
          'ছুটির দিন, প্রোমোশনাল ক্যাম্পেইন বা অতিরিক্ত অর্ডারের সময় প্রসেস হতে বাড়তি সময় লাগতে পারে।',
        ],
      },
      {
        title: 'সম্ভাব্য ডেলিভারি সময়',
        paragraphs: ['সাধারণ ডেলিভারি সময়:'],
        bullets: [
          'ঢাকার ভেতরে: ১–২ কার্যদিবস',
          'ঢাকার বাইরে: ১–২ কার্যদিবস',
        ],
        note: 'ডেলিভারির সময় আনুমানিক এবং এলাকা, আবহাওয়া, সরকারি ছুটি, কুরিয়ার পরিস্থিতি বা আমাদের নিয়ন্ত্রণের বাইরের কারণে ভিন্ন হতে পারে।',
      },
      {
        title: 'ডেলিভারি চার্জ',
        paragraphs: [
          'ডেলিভারি চার্জ নির্ধারিত হয় ডেলিভারির এলাকা, অর্ডারের পরিমাণ, ওজন এবং প্রযোজ্য কুরিয়ার চার্জের ভিত্তিতে।',
          'প্রযোজ্য ডেলিভারি চার্জ অর্ডার নিশ্চিত করার আগেই দেখানো বা জানানো হবে।',
        ],
      },
      {
        title: 'অর্ডার নিশ্চিতকরণ',
        paragraphs: [
          'অর্ডার করার পর আমাদের টিম ফোনে বা অন্য কোনো উপায়ে যোগাযোগ করে অর্ডার ও ডেলিভারি তথ্য নিশ্চিত করতে পারে।',
          'প্রয়োজনীয় তথ্য নিশ্চিত না হওয়া পর্যন্ত অর্ডার প্রসেস না-ও হতে পারে।',
        ],
      },
      {
        title: 'অর্ডার ট্র্যাকিং',
        paragraphs: [
          'ট্র্যাকিং তথ্য পাওয়া গেলে, চেকআউটে দেওয়া যোগাযোগের মাধ্যমে গ্রাহককে সেই তথ্য জানানো হতে পারে।',
        ],
      },
      {
        title: 'ডেলিভারি প্রচেষ্টা',
        paragraphs: [
          'আমাদের ডেলিভারি পার্টনার গ্রাহকের দেওয়া ফোন নম্বর ও ঠিকানা ব্যবহার করে পণ্য পৌঁছে দেওয়ার চেষ্টা করবে।',
          'গ্রাহককে অনুরোধ করা হচ্ছে সঠিক যোগাযোগ ও ঠিকানার তথ্য দিতে এবং ডেলিভারির সময় সহজলভ্য থাকতে।',
        ],
        note: 'ভুল ঠিকানা, গ্রাহককে না পাওয়া বা যোগাযোগ করতে না পারার কারণে ডেলিভারি ব্যর্থ হলে পরবর্তী ডেলিভারির জন্য অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।',
      },
      {
        title: 'বিলম্বিত বা হারিয়ে যাওয়া অর্ডার',
        paragraphs: [
          'আমরা নির্ভরযোগ্য ডেলিভারি পার্টনারের সঙ্গে কাজ করলেও অনাকাঙ্ক্ষিত বিলম্ব হতে পারে।',
          'আপনার অর্ডার উল্লেখযোগ্যভাবে দেরি হলে বা হারিয়ে গেছে মনে হলে অনুগ্রহ করে CP Market কাস্টমার সাপোর্টে যোগাযোগ করুন, আমরা সংশ্লিষ্ট ডেলিভারি পার্টনারের সঙ্গে বিষয়টি খতিয়ে দেখব।',
        ],
      },
      {
        title: 'ক্ষতিগ্রস্ত প্যাকেজ',
        paragraphs: [
          'প্যাকেজ মারাত্মকভাবে ক্ষতিগ্রস্ত অবস্থায় পেলে যত দ্রুত সম্ভব আমাদের জানান এবং সম্ভব হলে ছবি বা ভিডিও প্রমাণ দিন।',
          'আমরা বিষয়টি পর্যালোচনা করে আমাদের রিটার্ন ও রিফান্ড পলিসি অনুযায়ী সহায়তা করব।',
        ],
      },
      {
        title: 'ভুল ডেলিভারি তথ্য',
        paragraphs: ['সঠিক তথ্য দেওয়ার দায়িত্ব গ্রাহকের:'],
        bullets: [
          'নাম',
          'ফোন নম্বর',
          'ডেলিভারি ঠিকানা',
          'এলাকা ও পোস্টাল তথ্য',
        ],
        note: 'গ্রাহকের দেওয়া ভুল বা অসম্পূর্ণ তথ্যের কারণে সৃষ্ট ডেলিভারি সমস্যার জন্য CP Market দায়ী না-ও থাকতে পারে।',
      },
    ],
  },

  returns: {
    title: 'রিটার্ন ও রিফান্ড পলিসি',
    breadcrumb: 'রিটার্ন পলিসি',
    description:
      'কখন পণ্য ফেরত বা পরিবর্তন করা যাবে এবং রিফান্ড কীভাবে কাজ করে।',
    updated: 'সর্বশেষ হালনাগাদ: ১৬ আগস্ট ২০২৬',
    intro:
      'CP Market–এ আমরা চাই আপনি নিশ্চিন্তে কেনাকাটা করুন। আপনি যদি ক্ষতিগ্রস্ত, ত্রুটিপূর্ণ, ভুল বা অর্ডার করা পণ্য থেকে উল্লেখযোগ্যভাবে ভিন্ন কোনো পণ্য পান, তাহলে নিচের শর্ত অনুযায়ী রিটার্ন বা রিপ্লেসমেন্টের অনুরোধ করতে পারেন।',
    sections: [
      {
        title: 'রিটার্নের যোগ্যতা',
        paragraphs: ['নিচের ক্ষেত্রে রিটার্ন বা রিপ্লেসমেন্টের অনুরোধ গ্রহণ করা হতে পারে:'],
        bullets: [
          'ক্ষতিগ্রস্ত বা ত্রুটিপূর্ণ পণ্য পেলে।',
          'অর্ডার করা পণ্যের বদলে ভিন্ন পণ্য পেলে।',
          'আমাদের ভুলে ভুল সাইজ, রঙ বা ভ্যারিয়েন্ট পেলে।',
          'পণ্যের বিবরণে উল্লেখ নেই এমন উল্লেখযোগ্য মানগত সমস্যা থাকলে।',
        ],
      },
      {
        title: 'রিটার্নের সময়সীমা',
        paragraphs: [
          'রিটার্ন বা রিপ্লেসমেন্টের জন্য পণ্য হাতে পাওয়ার ৩ দিনের মধ্যে আমাদের সঙ্গে যোগাযোগ করতে হবে।',
        ],
        note: 'এই সময়সীমার পরে করা অনুরোধ গ্রহণ না-ও করা হতে পারে।',
      },
      {
        title: 'পণ্যের অবস্থা',
        paragraphs: ['রিটার্নের জন্য যোগ্য হতে হলে:'],
        bullets: [
          'পণ্য অব্যবহৃত ও না-পরা অবস্থায় থাকতে হবে।',
          'মূল ট্যাগ, প্যাকেজিং ও আনুষঙ্গিক জিনিস অক্ষত থাকতে হবে।',
          'পণ্য ধোয়া, পরিবর্তন করা, ক্ষতিগ্রস্ত বা ব্যবহৃত হওয়া যাবে না।',
          'কেনার প্রমাণ বা অর্ডারের তথ্য প্রয়োজন হতে পারে।',
        ],
      },
      {
        title: 'যেসব পণ্য ফেরতযোগ্য নয়',
        paragraphs: [
          'কিছু পণ্য তার প্রকৃতির কারণে ফেরতযোগ্য না-ও হতে পারে, যেমন:',
        ],
        bullets: [
          'ব্যবহৃত বা পরা পণ্য',
          'ধোয়া বা পরিবর্তন করা পণ্য',
          'ডেলিভারির পর গ্রাহকের ব্যবহারজনিত কারণে ক্ষতিগ্রস্ত পণ্য',
          'প্রয়োজনীয় ট্যাগ বা মূল প্যাকেজিং ছাড়া পণ্য',
          'স্পষ্টভাবে Final Sale / Non-Returnable হিসেবে চিহ্নিত পণ্য',
        ],
      },
      {
        title: 'রিটার্ন প্রক্রিয়া',
        paragraphs: [
          'রিটার্নের অনুরোধ করতে নিচের তথ্যসহ আমাদের কাস্টমার সাপোর্টে যোগাযোগ করুন:',
        ],
        bullets: [
          'অর্ডার নম্বর',
          'গ্রাহকের নাম',
          'ফোন নম্বর',
          'ফেরত দেওয়ার কারণ',
          'প্রযোজ্য ক্ষেত্রে পণ্যের স্পষ্ট ছবি বা ভিডিও',
        ],
        note: 'আমাদের টিম অনুরোধটি পর্যালোচনা করে পরবর্তী নির্দেশনা জানাবে।',
      },
      {
        title: 'রিটার্ন শিপিং',
        paragraphs: [
          'ভুল, ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত পণ্য পাঠানোর মতো আমাদের ভুলের কারণে রিটার্ন হলে প্রযোজ্য রিটার্ন ডেলিভারি খরচ CP Market বহন করতে পারে।',
          'অন্যান্য অনুমোদিত রিটার্নের ক্ষেত্রে রিটার্ন ডেলিভারি চার্জ গ্রাহকের দায়িত্ব হতে পারে।',
        ],
      },
      {
        title: 'পণ্য পরিবর্তন (এক্সচেঞ্জ)',
        paragraphs: [
          'প্রযোজ্য ক্ষেত্রে যোগ্য পণ্য অন্য সাইজ, রঙ বা পণ্যের সঙ্গে পরিবর্তন করা যেতে পারে।',
          'চাহিদা অনুযায়ী রিপ্লেসমেন্ট না থাকলে পরিস্থিতি অনুযায়ী আমরা বিকল্প সমাধান বা রিফান্ডের প্রস্তাব দিতে পারি।',
        ],
      },
      {
        title: 'রিফান্ড',
        paragraphs: [
          'ফেরত আসা পণ্য গ্রহণ ও যাচাইয়ের পর রিফান্ড অনুমোদিত হয়েছে কি না তা আমরা নিশ্চিত করব।',
          'অনুমোদিত রিফান্ড প্রযোজ্য পেমেন্ট মাধ্যমে বা সম্মত অন্য কোনো উপায়ে প্রক্রিয়া করা হবে।',
        ],
        note: 'পেমেন্ট প্রোভাইডার বা আর্থিক প্রতিষ্ঠানের ওপর নির্ভর করে রিফান্ড প্রক্রিয়ার সময় ভিন্ন হতে পারে।',
      },
      {
        title: 'অর্ডার বাতিল',
        paragraphs: [
          'অর্ডার প্রসেস বা শিপ হওয়ার আগে আপনি বাতিলের অনুরোধ করতে পারেন।',
          'অর্ডার শিপ হয়ে গেলে বাতিল করা না-ও যেতে পারে, সেক্ষেত্রে সাধারণ রিটার্ন পলিসি প্রযোজ্য হবে।',
        ],
      },
    ],
  },

  privacy: {
    title: 'প্রাইভেসি পলিসি',
    breadcrumb: 'প্রাইভেসি পলিসি',
    description:
      'আমরা কী তথ্য সংগ্রহ করি, কীভাবে ব্যবহার করি এবং আপনার কী কী সুযোগ আছে।',
    updated: 'সর্বশেষ হালনাগাদ: ১৬ আগস্ট ২০২৬',
    intro:
      'CP Market–এ আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ। আপনি যখন আমাদের ওয়েবসাইট cauyapauya.com ব্যবহার করেন, তখন আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার, সুরক্ষা ও ব্যবস্থাপনা করি তা এই প্রাইভেসি পলিসিতে ব্যাখ্যা করা হয়েছে।',
    sections: [
      {
        title: 'আমরা যেসব তথ্য সংগ্রহ করি',
        paragraphs: [
          'আপনি যখন আমাদের ওয়েবসাইট ব্যবহার করেন, অর্ডার করেন, অ্যাকাউন্ট তৈরি করেন বা যোগাযোগ করেন, তখন আমরা নিচের তথ্য সংগ্রহ করতে পারি:',
        ],
        bullets: [
          'নাম',
          'ফোন নম্বর',
          'ইমেইল ঠিকানা',
          'বিলিং ও ডেলিভারি ঠিকানা',
          'অর্ডার ও লেনদেনের তথ্য',
          'অ্যাকাউন্টের তথ্য',
          'কন্টাক্ট ফর্ম বা কাস্টমার সাপোর্টের মাধ্যমে দেওয়া তথ্য',
        ],
        note: 'এছাড়া আমরা কিছু কারিগরি তথ্যও সংগ্রহ করতে পারি, যেমন আপনার আইপি অ্যাড্রেস, ব্রাউজারের ধরন, ডিভাইসের তথ্য এবং ওয়েবসাইট ব্যবহারের তথ্য।',
      },
      {
        title: 'তথ্য যেভাবে ব্যবহার করি',
        paragraphs: ['আমরা আপনার তথ্য ব্যবহার করতে পারি:'],
        bullets: [
          'অর্ডার প্রসেস ও ডেলিভারি করতে',
          'পেমেন্ট নিশ্চিত ও ব্যবস্থাপনা করতে',
          'কাস্টমার সাপোর্ট দিতে',
          'অর্ডার সংক্রান্ত বিষয়ে আপনার সঙ্গে যোগাযোগ করতে',
          'আমাদের পণ্য, সেবা ও ওয়েবসাইট উন্নত করতে',
          'ওয়েবসাইটের নিরাপত্তা বজায় রাখতে',
          'প্রতারণা বা অননুমোদিত কার্যক্রম প্রতিরোধ করতে',
          'অনুমোদিত ক্ষেত্রে আপডেট, অফার বা প্রোমোশনাল বার্তা পাঠাতে',
        ],
      },
      {
        title: 'পেমেন্ট তথ্য',
        paragraphs: [
          'পেমেন্ট নির্ভরযোগ্য তৃতীয় পক্ষের পেমেন্ট প্রোভাইডারের মাধ্যমে প্রক্রিয়া হতে পারে। CP Market অপ্রয়োজনীয়ভাবে সংবেদনশীল পেমেন্ট তথ্য যেমন সম্পূর্ণ কার্ড নম্বর বা সিকিউরিটি কোড সংরক্ষণ করে না।',
        ],
      },
      {
        title: 'কুকিজ',
        paragraphs: [
          'ওয়েবসাইটের কার্যকারিতা উন্নত করতে, পছন্দ মনে রাখতে, ব্যবহারের ধরন বুঝতে এবং আরও ভালো শপিং অভিজ্ঞতা দিতে আমাদের ওয়েবসাইটে কুকিজ ও অনুরূপ প্রযুক্তি ব্যবহার করা হতে পারে।',
          'আপনি ব্রাউজার সেটিংস থেকে কুকিজ নিয়ন্ত্রণ বা বন্ধ করতে পারেন, তবে এতে ওয়েবসাইটের কিছু ফিচার ঠিকভাবে কাজ না-ও করতে পারে।',
        ],
      },
      {
        title: 'তথ্য শেয়ার করা',
        paragraphs: [
          'আমরা আপনার ব্যক্তিগত তথ্য বিক্রি বা ভাড়া দিই না।',
          'ব্যবসা পরিচালনার প্রয়োজনে নির্ভরযোগ্য সেবাদাতাদের সঙ্গে প্রয়োজনীয় তথ্য শেয়ার করতে পারি, যেমন পেমেন্ট প্রসেসর, ডেলিভারি পার্টনার, হোস্টিং প্রোভাইডার বা কারিগরি সেবাদাতা।',
          'আইনি বাধ্যবাধকতা থাকলে, কিংবা আমাদের অধিকার, ব্যবহারকারী বা ওয়েবসাইট রক্ষার প্রয়োজনে আমরা তথ্য প্রকাশ করতে পারি।',
        ],
      },
      {
        title: 'তথ্যের নিরাপত্তা',
        paragraphs: [
          'অননুমোদিত প্রবেশ, অপব্যবহার, পরিবর্তন, প্রকাশ বা হারানো থেকে আপনার ব্যক্তিগত তথ্য রক্ষা করতে আমরা যুক্তিসঙ্গত কারিগরি ও প্রাতিষ্ঠানিক ব্যবস্থা নিই।',
        ],
        note: 'তবে অনলাইনে কোনো তথ্য আদান-প্রদান বা ইলেকট্রনিক সংরক্ষণ ব্যবস্থা শতভাগ নিরাপদ বলে নিশ্চয়তা দেওয়া সম্ভব নয়।',
      },
      {
        title: 'আপনার সুযোগসমূহ',
        paragraphs: ['নিচের বিষয়ে আপনি আমাদের সঙ্গে যোগাযোগ করতে পারেন:'],
        bullets: [
          'আপনার সম্পর্কে আমাদের কাছে থাকা তথ্য জানতে চাওয়া',
          'ভুল তথ্য সংশোধনের অনুরোধ',
          'প্রযোজ্য ক্ষেত্রে তথ্য মুছে ফেলার অনুরোধ',
          'আপনার তথ্য কীভাবে ব্যবহার হচ্ছে সে বিষয়ে প্রশ্ন',
          'নির্দিষ্ট প্রোমোশনাল বার্তা বন্ধ করার অনুরোধ',
        ],
      },
      {
        title: 'তৃতীয় পক্ষের লিংক',
        paragraphs: [
          'আমাদের ওয়েবসাইটে তৃতীয় পক্ষের ওয়েবসাইট বা সেবার লিংক থাকতে পারে। সেসব ওয়েবসাইটের গোপনীয়তা নীতি বা কনটেন্টের জন্য CP Market দায়ী নয়।',
          'ব্যক্তিগত তথ্য দেওয়ার আগে তাদের প্রাইভেসি পলিসি পড়ে নেওয়ার পরামর্শ দিচ্ছি।',
        ],
      },
      {
        title: 'শিশুদের গোপনীয়তা',
        paragraphs: [
          'যথাযথ সম্মতি ছাড়া শিশুদের ব্যক্তিগত তথ্য সংগ্রহ করা আমাদের ওয়েবসাইটের উদ্দেশ্য নয়। এমন তথ্য অনুচিতভাবে সংগ্রহ হয়েছে জানতে পারলে আমরা প্রয়োজনীয় পদক্ষেপ নেব।',
        ],
      },
      {
        title: 'এই পলিসির পরিবর্তন',
        paragraphs: [
          'আমাদের সেবা, প্রযুক্তি বা আইনি প্রয়োজনের পরিবর্তনের সঙ্গে সামঞ্জস্য রাখতে আমরা সময়ে সময়ে এই প্রাইভেসি পলিসি হালনাগাদ করতে পারি।',
          'হালনাগাদ সংস্করণ নতুন “সর্বশেষ হালনাগাদ” তারিখসহ এই পেজে প্রকাশ করা হবে।',
        ],
      },
    ],
  },

  terms: {
    title: 'শর্তাবলি',
    breadcrumb: 'শর্তাবলি',
    description:
      'cauyapauya.com ব্যবহার বা অর্ডার করার ক্ষেত্রে যেসব শর্ত প্রযোজ্য।',
    updated: 'সর্বশেষ হালনাগাদ: ১৯ আগস্ট ২০২৬',
    intro:
      'এই শর্তাবলি cauyapauya.com ব্যবহার এবং CP Market–এ করা যেকোনো অর্ডারের ক্ষেত্রে প্রযোজ্য। ওয়েবসাইট ব্যবহার বা অর্ডার করার মাধ্যমে আপনি নিচের শর্তগুলোতে সম্মত হচ্ছেন।',
    sections: [
      {
        title: 'শর্ত গ্রহণ',
        paragraphs: [
          'আমাদের ওয়েবসাইটে প্রবেশ, অ্যাকাউন্ট তৈরি বা অর্ডার করার মাধ্যমে আপনি নিশ্চিত করছেন যে আপনি এই শর্তাবলির পাশাপাশি আমাদের প্রাইভেসি পলিসি, শিপিং পলিসি এবং রিটার্ন ও রিফান্ড পলিসি পড়েছেন ও মেনে নিয়েছেন।',
          'এই শর্তের কোনো অংশে সম্মত না হলে অনুগ্রহ করে ওয়েবসাইট ব্যবহার বা অর্ডার করা থেকে বিরত থাকুন।',
        ],
      },
      {
        title: 'যোগ্যতা ও অ্যাকাউন্ট',
        paragraphs: [
          'অর্ডার করতে হলে প্রযোজ্য আইন অনুযায়ী আপনাকে বৈধ চুক্তিতে আবদ্ধ হওয়ার যোগ্য হতে হবে।',
          'অ্যাকাউন্ট তৈরি করলে লগইন তথ্য নিরাপদ রাখা এবং অ্যাকাউন্টের মাধ্যমে করা কার্যক্রমের দায়িত্ব আপনার। অনুমতি ছাড়া আপনার অ্যাকাউন্ট ব্যবহার হয়েছে মনে হলে সঙ্গে সঙ্গে আমাদের জানান।',
        ],
      },
      {
        title: 'পণ্য ও প্রাপ্যতা',
        paragraphs: [
          'আমরা পণ্যের বিবরণ যথাসম্ভব সঠিকভাবে দেওয়ার চেষ্টা করি, তবে স্ক্রিনভেদে এবং কাপড় ও উৎপাদনের স্বাভাবিক তারতম্যের কারণে রঙ, টেক্সচার ও মাপ কিছুটা ভিন্ন দেখাতে পারে।',
          'সব পণ্য স্টকের ওপর নির্ভরশীল। অর্ডারের পর কোনো পণ্য অনুপলব্ধ হলে আমরা আপনার সঙ্গে যোগাযোগ করে বিকল্প পণ্য, আংশিক ডেলিভারি বা সেই পণ্যটি বাতিলের ব্যবস্থা করতে পারি।',
        ],
      },
      {
        title: 'মূল্য',
        paragraphs: [
          'সব মূল্য বাংলাদেশি টাকায় (BDT) দেখানো হয় এবং পূর্ব নোটিশ ছাড়াই পরিবর্তন হতে পারে। আপনার অর্ডারের ক্ষেত্রে অর্ডার নিশ্চিত হওয়ার সময়ের মূল্যই প্রযোজ্য।',
          'ডেলিভারি চার্জ আলাদা এবং অর্ডার নিশ্চিত করার আগেই তা দেখানো বা জানানো হয়।',
        ],
        note: 'অর্ডারে স্পষ্ট মূল্য বা টাইপিং ভুল ধরা পড়লে শিপ করার আগে আমরা আপনার সঙ্গে যোগাযোগ করে তা সংশোধন বা সংশ্লিষ্ট অর্ডার বাতিল করতে পারি।',
      },
      {
        title: 'অর্ডার ও অর্ডার নিশ্চিতকরণ',
        paragraphs: [
          'অর্ডার করা মানে কেনার প্রস্তাব দেওয়া। আমরা নিশ্চিত করার পরই অর্ডার গৃহীত বলে গণ্য হয়, এবং আমাদের টিম ফোনে বা অন্য উপায়ে যোগাযোগ করে অর্ডার ও ডেলিভারির তথ্য নিশ্চিত করতে পারে।',
          'পণ্য অনুপলব্ধ থাকলে, দেওয়া তথ্য অসম্পূর্ণ বা ভুল হলে, কিংবা প্রতারণামূলক বা অপব্যবহারমূলক কার্যক্রমের যুক্তিসঙ্গত সন্দেহ হলে আমরা অর্ডার বাতিল বা প্রত্যাখ্যান করতে পারি।',
        ],
      },
      {
        title: 'পেমেন্ট',
        paragraphs: [
          'চেকআউটে অন্য কোনো পেমেন্ট মাধ্যম সুস্পষ্টভাবে দেওয়া না থাকলে অর্ডার ক্যাশ অন ডেলিভারিতে পরিশোধযোগ্য।',
          'ক্যাশ অন ডেলিভারির ক্ষেত্রে ডেলিভারি চার্জসহ সম্পূর্ণ মূল্য ডেলিভারির সময় আমাদের ডেলিভারি পার্টনারকে পরিশোধ করতে হবে।',
        ],
      },
      {
        title: 'শিপিং ও ডেলিভারি',
        paragraphs: [
          'প্রসেসিং সময়, সম্ভাব্য ডেলিভারি সময়, ডেলিভারি চার্জ এবং বিলম্বিত, ব্যর্থ বা ক্ষতিগ্রস্ত ডেলিভারির ক্ষেত্রে আমাদের করণীয় শিপিং পলিসিতে বর্ণিত আছে, যা এই শর্তাবলির অংশ।',
        ],
      },
      {
        title: 'বাতিল, রিটার্ন ও রিফান্ড',
        paragraphs: [
          'অর্ডার প্রসেস বা শিপ হওয়ার আগে আপনি বাতিলের অনুরোধ করতে পারেন। রিটার্ন, রিপ্লেসমেন্ট ও রিফান্ডের যোগ্যতা রিটার্ন ও রিফান্ড পলিসিতে বর্ণিত আছে, যা এই শর্তাবলির অংশ।',
        ],
      },
      {
        title: 'কুপন ও প্রোমোশন',
        paragraphs: [
          'ডিসকাউন্ট কোড, ক্যাম্পেইন ও প্রোমোশনাল অফারের নিজস্ব শর্ত থাকতে পারে, যেমন সর্বনিম্ন অর্ডার মূল্য, মেয়াদ, নির্দিষ্ট পণ্য বা গ্রাহকপ্রতি ব্যবহারের সীমা।',
          'আমরা যেকোনো সময় অফার প্রত্যাহার বা পরিবর্তন করতে পারি, এবং অপব্যবহারের মাধ্যমে বা বারবার বাতিল/অগৃহীত অর্ডারের মাধ্যমে নেওয়া ডিসকাউন্ট বাতিল করতে পারি।',
        ],
      },
      {
        title: 'হোলসেল ও সেলার অ্যাকাউন্ট',
        paragraphs: [
          'আবেদন যাচাই ও অনুমোদনের পরই হোলসেল অ্যাক্সেস দেওয়া হয়, এবং নির্ধারিত শর্ত পালন না হলে অনুমোদন স্থগিত বা বাতিল করা হতে পারে।',
          'আমাদের প্ল্যাটফর্মে পণ্য তালিকাভুক্ত করা সেলাররা তাদের লিস্টিংয়ের সঠিকতা, পণ্যের মান ও বৈধতা এবং গৃহীত অর্ডার সরবরাহের জন্য দায়ী। প্রযোজ্য কমিশন ও সেটেলমেন্টের শর্ত বিক্রির সময় সেলার ড্যাশবোর্ডে যা দেখানো থাকে তা-ই।',
        ],
      },
      {
        title: 'রিভিউ ও ব্যবহারকারীর কনটেন্ট',
        paragraphs: [
          'আপনার দেওয়া রিভিউ, রেটিং ও বার্তা আপনার নিজের হতে হবে এবং তাতে বেআইনি, বিভ্রান্তিকর, আপত্তিকর বা অন্যের অধিকার লঙ্ঘনকারী কনটেন্ট থাকা যাবে না।',
          'আমরা জমা দেওয়া কনটেন্ট প্রকাশ করতে, প্রকাশ না করতে বা সরিয়ে ফেলতে পারি, এবং আমাদের স্টোর পরিচালনা ও প্রচারের কাজে তা ব্যবহার করতে পারি।',
        ],
      },
      {
        title: 'গ্রহণযোগ্য ব্যবহার',
        paragraphs: [
          'ওয়েবসাইটের ক্ষতি করা, অচল করা, অতিরিক্ত চাপ সৃষ্টি করা, অননুমোদিতভাবে প্রবেশের চেষ্টা করা বা অন্য গ্রাহকের ব্যবহারে বাধা দেওয়া থেকে বিরত থাকতে আপনি সম্মত হচ্ছেন।',
          'আমাদের অনুমতি ছাড়া স্বয়ংক্রিয় উপায়ে ওয়েবসাইট থেকে তথ্য সংগ্রহ বা আমাদের কনটেন্ট পুনঃবিক্রি করা যাবে না।',
        ],
      },
      {
        title: 'মেধাস্বত্ব',
        paragraphs: [
          'CP Market–এর নাম, লোগো, ওয়েবসাইট ডিজাইন, লেখা, গ্রাফিক্স ও পণ্যের ছবি CP Market–এর মালিকানাধীন বা লাইসেন্সপ্রাপ্ত এবং প্রযোজ্য আইনে সুরক্ষিত।',
          'আমাদের পূর্ব লিখিত অনুমতি ছাড়া এগুলো কপি, পুনরুৎপাদন বা বাণিজ্যিক কাজে ব্যবহার করা যাবে না।',
        ],
      },
      {
        title: 'তৃতীয় পক্ষের লিংক ও সেবা',
        paragraphs: [
          'আমাদের ওয়েবসাইটে পেমেন্ট প্রোভাইডার, ডেলিভারি পার্টনার ও সোশ্যাল প্ল্যাটফর্মের মতো তৃতীয় পক্ষের লিংক বা সেবা থাকতে পারে। তাদের কনটেন্ট, নীতি বা সেবার মানের জন্য আমরা দায়ী নই।',
        ],
      },
      {
        title: 'দায়সীমা',
        paragraphs: [
          'আমরা যুক্তিসঙ্গত যত্নের সঙ্গে ওয়েবসাইট ও সেবা পরিচালনা করি, তবে ওয়েবসাইট সবসময় সচল, নিরবচ্ছিন্ন বা ত্রুটিমুক্ত থাকবে এমন নিশ্চয়তা দিই না।',
          'আইন অনুমোদিত সীমার মধ্যে, কোনো অর্ডার সংক্রান্ত বিষয়ে আমাদের দায় ওই অর্ডারের মূল্যের মধ্যে সীমাবদ্ধ থাকবে।',
        ],
      },
      {
        title: 'গোপনীয়তা',
        paragraphs: [
          'আপনার দেওয়া তথ্য আমাদের প্রাইভেসি পলিসি অনুযায়ী পরিচালনা করা হয়, যেখানে আমরা কী সংগ্রহ করি, কীভাবে ব্যবহার করি এবং আপনার কী সুযোগ আছে তা ব্যাখ্যা করা হয়েছে।',
        ],
      },
      {
        title: 'শর্তাবলির পরিবর্তন',
        paragraphs: [
          'সেবা, প্রযুক্তি বা আইনি প্রয়োজনের পরিবর্তনের সঙ্গে সামঞ্জস্য রাখতে আমরা সময়ে সময়ে এই শর্তাবলি হালনাগাদ করতে পারি। হালনাগাদ সংস্করণ নতুন “সর্বশেষ হালনাগাদ” তারিখসহ এই পেজে প্রকাশ করা হবে।',
          'আপনার অর্ডারের ক্ষেত্রে অর্ডার করার সময় প্রকাশিত শর্তাবলিই প্রযোজ্য হবে।',
        ],
      },
      {
        title: 'প্রযোজ্য আইন',
        paragraphs: [
          'এই শর্তাবলি বাংলাদেশের প্রচলিত আইন দ্বারা পরিচালিত এবং এ সংক্রান্ত যেকোনো বিরোধ বাংলাদেশের আদালতের এখতিয়ারভুক্ত হবে।',
        ],
      },
    ],
  },
}

export const POLICIES: Record<Locale, Record<PolicySlug, PolicyDoc>> = { en, bn }

export function getPolicy(locale: Locale, slug: PolicySlug): PolicyDoc {
  return POLICIES[locale][slug]
}
