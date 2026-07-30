'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SectionPanel } from '@/components/layout/section-panel'
import { useLanguage } from '@/components/language-provider'

/**
 * Store-policy questions, shown on every product page.
 *
 * The content is deliberately not product-specific — these are what shoppers
 * actually ask before buying anything, and they live in the dictionary so they
 * are editable and translated. Two consequences of that, both intentional:
 *
 * - It sits *below* the reviews, so the genuinely product-specific content comes
 *   first and this boilerplate second.
 * - It ships no `FAQPage` structured data. Identical JSON-LD across every
 *   product URL is what Google's guidance warns against; a single dedicated FAQ
 *   page is the right place for that if it is ever wanted.
 *
 * `type="single"` so only one answer is open at a time, and every item starts
 * collapsed — the list is long and the page is already long.
 */
export function ProductFaq() {
  const { t } = useLanguage()
  const copy = t.product

  // Split into two columns that fill left-to-right, so reading order matches
  // visual order.
  const half = Math.ceil(copy.faq.length / 2)
  const columns = [copy.faq.slice(0, half), copy.faq.slice(half)]

  return (
    <SectionPanel title={copy.faqTitle}>
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">
        {copy.faqSubtitle}
      </p>

      <div className="grid gap-x-10 md:grid-cols-2">
        {columns.map((column, index) => (
          <Accordion
            key={index}
            type="single"
            collapsible
            className="border-t border-border"
          >
            {column.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>
    </SectionPanel>
  )
}
