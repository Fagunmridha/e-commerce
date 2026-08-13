'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useLanguage } from '@/components/language-provider'
import { submitContactMessage } from '@/app/actions/contact'
import { BD_PHONE } from '@/lib/validation/shared'
import type { Dictionary } from '@/lib/dictionaries'

/** Built per render so validation messages follow the active language. */
function buildSchema(errors: Dictionary['contact']['errors']) {
  return z.object({
    name: z.string().min(2, errors.name),
    email: z.string().email(errors.email),
    // Same rule the server enforces, so a valid form never fails on the round
    // trip and an invalid one is caught in the customer's own language.
    phone: z.string().regex(BD_PHONE, errors.phone),
    subject: z.string().min(3, errors.subject),
    message: z.string().min(10, errors.message),
  })
}

type ContactValues = z.infer<ReturnType<typeof buildSchema>>

export function ContactForm() {
  const { t } = useLanguage()
  const form = useForm<ContactValues>({
    resolver: zodResolver(buildSchema(t.contact.errors)),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  })

  /**
   * The message goes to `contact_messages`, which is what the admin console's
   * Messages inbox reads. Nothing is emailed from here — the admin replies from
   * the inbox, so a message can never be lost to a bounced notification.
   */
  async function onSubmit(values: ContactValues) {
    const result = await submitContactMessage(values)

    if (!result.ok) {
      const spam = result.error === 'too-many'
      toast.error(spam ? t.contact.tooMany : t.contact.failed, {
        description: spam
          ? t.contact.tooManyDescription
          : // The server's message is in English; the localised line is the
            // honest fallback when it has nothing more specific to say.
            result.message ?? t.contact.failedDescription,
      })
      return
    }

    toast.success(t.contact.sent, {
      description: t.contact.sentDescription
        .replace('{name}', values.name)
        .replace('{email}', values.email),
    })
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.contact.name}</FormLabel>
                <FormControl>
                  <Input placeholder={t.contact.namePlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.contact.email}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t.contact.emailPlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone sits beside the subject rather than under the email: it is how
            the team actually reaches a customer about an order, and pairing it
            with the email would push the subject onto a line of its own. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.contact.phone}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder={t.contact.phonePlaceholder}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.contact.subject}</FormLabel>
                <FormControl>
                  <Input placeholder={t.contact.subjectPlaceholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.contact.message}</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder={t.contact.messagePlaceholder}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? t.contact.sending : t.contact.submit}
        </Button>
      </form>
    </Form>
  )
}
