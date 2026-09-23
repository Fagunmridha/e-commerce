import { AccountProfile } from '@/components/account/account-profile'
import { getAccountContext } from '@/lib/account'

export default async function AccountProfilePage() {
  const { name, email, memberSince, wholesaleRole } = await getAccountContext()

  return (
    <AccountProfile
      name={name}
      email={email}
      memberSince={memberSince}
      wholesaleRole={wholesaleRole}
    />
  )
}
