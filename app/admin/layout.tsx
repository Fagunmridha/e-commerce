import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Users } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import { isAdmin } from '@/lib/auth'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/users', label: 'Users', icon: Users },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAdmin())) redirect('/')

  return (
    <div className="mx-auto flex max-w-page flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-10">
      <aside className="lg:w-52 lg:shrink-0">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Admin</h1>
          <UserButton />
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
