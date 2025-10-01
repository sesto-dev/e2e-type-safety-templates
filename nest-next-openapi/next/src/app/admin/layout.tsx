import KBar from '~/components/kbar'
import AppSidebar from '~/components/sidebar/app-sidebar'
import Header from '~/components/layout/header'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { navItems } from '~/config/sidebar-items-admin'
import { siteConfig } from '~/config/site'
import getCurrentUser from '~/lib/server/current-user'

export const metadata: Metadata = {
  title: siteConfig().name,
  description: siteConfig().description,
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user.groups.some((group) => group.name === 'owner')) redirect('/login')

  return (
    <KBar navItems={navItems}>
      <SidebarProvider>
        <AppSidebar navItems={navItems} user={user} />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  )
}
