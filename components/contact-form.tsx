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
import type { Dictionary } from '@/lib/dictionaries'

/** Built per render so validation messages follow the active language. */
function buildSchema(errors: Dictionary['contact']['errors']) {
  return z.object({
    name: z.string().min(2, errors.name),
    email: z.string().email(errors.email),
    subject: z.string().min(3, errors.subject),
    message: z.string().min(10, errors.message),
  })
}

type ContactValues = z.infer<ReturnType<typeof buildSchema>>

export function ContactForm() {
  const { t } = useLanguage()
  const form = useForm<ContactValues>({
    resolver: zodResolver(buildSchema(t.contact.errors)),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  })

  // No backend yet — messages are acknowledged locally until the API lands.
  function onSubmit(values: ContactValues) {
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
          {t.contact.submit}
        </Button>
      </form>
    </Form>
  )
}
