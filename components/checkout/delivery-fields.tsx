'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLanguage } from '@/components/language-provider'
import { formatPrice, SHIPPING_RATES, type DeliveryZone } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { DeliveryValues } from '@/lib/validation/checkout'

/** In display order — the cheaper, more common zone first. */
const ZONES: DeliveryZone[] = ['dhaka', 'outside']

/**
 * Name / phone / address / city / notes — the block every order path collects.
 *
 * It reads the form off `useFormContext` rather than taking a `control` prop so
 * that a caller whose schema *extends* `DeliveryValues` (the pre-order checkout
 * carries three advance fields as well) needs no generics and no casts. The
 * only requirement is being rendered inside `<Form {...form}>`, which is
 * `FormProvider` — the same thing shadcn's own `useFormField` depends on.
 *
 * `two-column` puts name and phone side by side on ≥sm; `stacked` is the
 * narrow-column form used inside the `/lp/[id]` order card.
 */
export function DeliveryFields({
  layout = 'stacked',
  notesRows = 3,
}: {
  layout?: 'stacked' | 'two-column'
  notesRows?: number
}) {
  const { t } = useLanguage()
  const { control } = useFormContext<DeliveryValues>()

  return (
    <>
      <div
        className={
          layout === 'two-column' ? 'grid gap-6 sm:grid-cols-2' : 'space-y-4'
        }
      >
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.checkout.fullName}</FormLabel>
              <FormControl>
                <Input placeholder={t.checkout.fullNamePlaceholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.checkout.phone}</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder={t.checkout.phonePlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.checkout.address}</FormLabel>
            <FormControl>
              <Input placeholder={t.checkout.addressPlaceholder} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.checkout.city}</FormLabel>
            <FormControl>
              <Input placeholder={t.checkout.cityPlaceholder} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* The delivery charge is priced from this, not from `city` above — see
          the schema. Two cards rather than a select: it is a two-way choice
          that changes the total, so it should be readable without opening
          anything, and each option carries its own price. */}
      <FormField
        control={control}
        name="zone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.checkout.deliveryArea}</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-3 sm:grid-cols-2"
              >
                {ZONES.map((zone) => (
                  <FormLabel
                    key={zone}
                    // A label wrapping the input: the whole card is the target,
                    // which on a phone is the difference between a tap and a
                    // miss.
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 font-normal transition-colors',
                      field.value === zone
                        ? 'border-primary bg-accent ring-2 ring-ring/20'
                        : 'border-border hover:border-primary hover:bg-accent/40',
                    )}
                  >
                    <RadioGroupItem value={zone} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {zone === 'dhaka'
                          ? t.checkout.zoneDhaka
                          : t.checkout.zoneOutside}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t.checkout.zoneRate.replace(
                          '{amount}',
                          formatPrice(SHIPPING_RATES[zone]),
                        )}
                      </span>
                    </span>
                  </FormLabel>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t.checkout.notes}</FormLabel>
            <FormControl>
              <Textarea
                rows={notesRows}
                placeholder={t.checkout.notesPlaceholder}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
