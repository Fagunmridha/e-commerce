'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLanguage } from '@/components/language-provider'
import type { DeliveryValues } from '@/lib/validation/checkout'

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
          layout === 'two-column' ? 'grid gap-5 sm:grid-cols-2' : 'space-y-4'
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
