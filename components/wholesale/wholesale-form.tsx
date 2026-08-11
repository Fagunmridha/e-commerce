'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUploader } from '@/components/admin/image-uploader'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLanguage } from '@/components/language-provider'
import { useCatalogue } from '@/components/catalogue-provider'
import { submitWholesaleApplication } from '@/app/actions/wholesale'
import { BUSINESS_TYPES } from '@/lib/validation/wholesalers'
import { BD_PHONE } from '@/lib/validation/shared'
import type { Dictionary } from '@/lib/dictionaries'
import type { WholesaleApplicationView } from '@/components/wholesale/types'

/** Built per render so validation messages follow the active language. */
function buildSchema(errors: Dictionary['wholesale']['errors']) {
  const optional = z.string().optional()

  return z.object({
    shopName: z.string().min(2, errors.shopName),
    businessType: z.enum(BUSINESS_TYPES),
    taxToken: optional,
    binNumber: optional,
    tradeLicenseNo: optional,
    yearsInBusiness: optional,

    contactName: z.string().min(2, errors.contactName),
    phone: z.string().regex(BD_PHONE, errors.phone),
    // Blank is fine; anything typed still has to be a real number.
    altPhone: z
      .string()
      .optional()
      .refine((value) => !value || BD_PHONE.test(value), errors.phone),
    email: z.string().email(errors.email),
    website: optional,

    address: z.string().min(5, errors.address),
    city: z.string().min(2, errors.city),
    district: optional,
    postcode: optional,

    note: optional,
    agree: z.literal(true, { errorMap: () => ({ message: errors.agree }) }),
  })
}

type WholesaleValues = z.infer<ReturnType<typeof buildSchema>>

/** The three photos an admin looks at before approving a shop. */
type Documents = {
  taxTokenImage: string
  tradeLicenseImage: string
  shopPhoto: string
}

/** '' → null, and a number field that was left blank stays blank, not NaN. */
function numberOrNull(value: string | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function WholesaleForm({
  application,
  defaultName,
  defaultEmail,
  onCancel,
}: {
  application: WholesaleApplicationView | null
  defaultName: string
  defaultEmail: string
  onCancel?: () => void
}) {
  const { t } = useLanguage()
  const router = useRouter()
  const copy = t.wholesale.form

  const form = useForm<WholesaleValues>({
    resolver: zodResolver(buildSchema(t.wholesale.errors)),
    defaultValues: {
      shopName: application?.shopName ?? '',
      businessType: application?.businessType ?? 'retail_shop',
      taxToken: application?.taxToken ?? '',
      binNumber: application?.binNumber ?? '',
      tradeLicenseNo: application?.tradeLicenseNo ?? '',
      yearsInBusiness: application?.yearsInBusiness?.toString() ?? '',
      contactName: application?.contactName ?? defaultName,
      phone: application?.phone ?? '',
      altPhone: application?.altPhone ?? '',
      email: application?.email ?? defaultEmail,
      website: application?.website ?? '',
      address: application?.address ?? '',
      city: application?.city ?? '',
      district: application?.district ?? '',
      postcode: application?.postcode ?? '',
      note: application?.note ?? '',
      agree: undefined,
    },
  })

  // The uploads sit outside react-hook-form — each one is an uploader with its
  // own progress and preview state, which RHF has nothing to add to.
  const [documents, setDocuments] = useState<Documents>({
    taxTokenImage: application?.taxTokenImage ?? '',
    tradeLicenseImage: application?.tradeLicenseImage ?? '',
    shopPhoto: application?.shopPhoto ?? '',
  })

  const setDocument = (patch: Partial<Documents>) =>
    setDocuments((current) => ({ ...current, ...patch }))

  async function onSubmit(values: WholesaleValues) {
    const result = await submitWholesaleApplication({
      shopName: values.shopName,
      businessType: values.businessType,
      taxToken: values.taxToken,
      binNumber: values.binNumber,
      tradeLicenseNo: values.tradeLicenseNo,
      yearsInBusiness: numberOrNull(values.yearsInBusiness),
      contactName: values.contactName,
      phone: values.phone,
      altPhone: values.altPhone,
      email: values.email,
      website: values.website,
      address: values.address,
      city: values.city,
      district: values.district,
      postcode: values.postcode,
      taxTokenImage: documents.taxTokenImage || null,
      tradeLicenseImage: documents.tradeLicenseImage || null,
      shopPhoto: documents.shopPhoto || null,
      note: values.note,
    })

    if (!result.ok) {
      toast.error(copy.failed, { description: result.error })
      return
    }

    toast.success(copy.submitted, { description: copy.submittedBody })
    onCancel?.()
    router.refresh()
  }

  const isEdit = Boolean(application)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Section title={copy.businessSection}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Text name="shopName" label={copy.shopName} placeholder={copy.shopNamePlaceholder} form={form} />
            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{copy.businessType}</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {copy.businessTypes[type]}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Text name="taxToken" label={copy.taxToken} hint={copy.optional} form={form} />
            <Text name="binNumber" label={copy.binNumber} hint={copy.optional} form={form} />
            <Text name="tradeLicenseNo" label={copy.tradeLicenseNo} hint={copy.optional} form={form} />
            <Text name="yearsInBusiness" label={copy.yearsInBusiness} hint={copy.optional} type="number" form={form} />
          </div>
        </Section>

        <Section title={copy.contactSection}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Text name="contactName" label={copy.contactName} form={form} />
            <Text name="phone" label={copy.phone} placeholder={copy.phonePlaceholder} type="tel" form={form} />
            <Text name="altPhone" label={copy.altPhone} placeholder={copy.phonePlaceholder} hint={copy.optional} type="tel" form={form} />
            <Text name="email" label={copy.email} placeholder={copy.emailPlaceholder} type="email" form={form} />
            <Text name="website" label={copy.website} hint={copy.optional} form={form} />
          </div>
        </Section>

        <Section title={copy.addressSection}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Text name="address" label={copy.address} form={form} />
            </div>
            <Text name="city" label={copy.city} form={form} />
            <Text name="district" label={copy.district} hint={copy.optional} form={form} />
            <Text name="postcode" label={copy.postcode} hint={copy.optional} form={form} />
          </div>
        </Section>

        <Section title={copy.documentsSection} hint={copy.documentsHint}>
          <div className="grid gap-5 sm:grid-cols-3">
            <ImageUploader
              value={documents.taxTokenImage}
              onChange={(url) => setDocument({ taxTokenImage: url })}
              folder="wholesale-documents"
              label={copy.taxTokenImage}
              hint={copy.optional}
            />
            <ImageUploader
              value={documents.tradeLicenseImage}
              onChange={(url) => setDocument({ tradeLicenseImage: url })}
              folder="wholesale-documents"
              label={copy.tradeLicenseImage}
              hint={copy.optional}
            />
            <ImageUploader
              value={documents.shopPhoto}
              onChange={(url) => setDocument({ shopPhoto: url })}
              folder="wholesale-documents"
              label={copy.shopPhoto}
            />
          </div>
        </Section>

        <Section title={copy.noteSection}>
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{copy.note}</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <FormField
          control={form.control}
          name="agree"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start gap-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true ? true : undefined)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="font-normal">{copy.agree}</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? copy.submitting
              : isEdit
                ? copy.resubmit
                : copy.submit}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              {t.wholesale.status.cancel}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** The plain-text field this form repeats two dozen times. */
function Text({
  name,
  label,
  placeholder,
  hint,
  type = 'text',
  form,
}: {
  name: keyof WholesaleValues
  label: string
  placeholder?: string
  hint?: string
  type?: string
  form: ReturnType<typeof useForm<WholesaleValues>>
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              value={typeof field.value === 'string' ? field.value : ''}
            />
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
