import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { RoleToggle } from '@/components/admin/role-toggle'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const me = await getCurrentUser()
  const rows = await db.select().from(users).orderBy(desc(users.createdAt))

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-foreground">Users</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {user.name || '—'}
                  {me?.id === user.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      user.role === 'admin'
                        ? 'rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary'
                        : 'rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground'
                    }
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RoleToggle
                    userId={user.id}
                    role={user.role}
                    isSelf={me?.id === user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
