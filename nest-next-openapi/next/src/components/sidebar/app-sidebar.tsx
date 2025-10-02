'use client'

import * as React from 'react'
import {
  IconDashboard,
  IconListDetails,
  IconFileDescription,
  IconFolder,
  IconChevronDown,
  IconDatabase,
  IconUsers,
  IconSettings,
  IconReport,
  IconMailSpark,
  IconCurrencyDollar,
  IconUsersGroup,
  IconUserPentagon,
} from '@tabler/icons-react'
import { CreditCard } from 'lucide-react'

import { NavMain } from '~/components/sidebar/nav-main'
import { NavUser } from '~/components/sidebar/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '~/components/ui/sidebar'
import type { User } from '~/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ---------------------------------
// Data definitions
// ---------------------------------
const data = {
  navMain: [{ title: 'Dashboard', url: '/admin', icon: IconDashboard }],
  navGroups: [
    {
      id: 'user',
      title: 'Users',
      icon: IconUsers,
      items: [
        { title: 'Edit', url: '/admin/user/edit', icon: IconSettings },
        {
          title: 'Notifications',
          url: '/admin/user/notifications',
          icon: IconReport,
        },
        { title: 'Payments', url: '/admin/user/payments', icon: CreditCard },
        { title: 'Referrals', url: '/admin/user/referrals', icon: IconUsers },
      ],
    },
    {
      id: 'support',
      title: 'Support',
      icon: IconUserPentagon,
      items: [
        { title: 'Contact', url: '/admin/support/contact', icon: CreditCard },
        { title: 'FAQ', url: '/admin/support/faq', icon: IconUsers },
      ],
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: Partial<User>
}

// ---------------------------------
// Component
// ---------------------------------
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const router = useRouter()
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    {}
  )

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="#">
                <span className="text-base font-semibold">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />

        {/* Render collapsible nav groups dynamically */}
        {data.navGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true
          return (
            <SidebarMenu key={group.id}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${group.id}-submenu`}
                  tooltip={group.title}
                >
                  <group.icon />
                  <span>{group.title}</span>
                  <IconChevronDown
                    className={`ml-auto transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </SidebarMenuButton>

                {isOpen && (
                  <SidebarMenuSub
                    id={`${group.id}-submenu`}
                    role="region"
                    aria-label={`${group.title} submenu`}
                  >
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton asChild>
                          <Link
                            href={item.url}
                            onClick={
                              item.url === '/admin/user/referrals'
                                ? (e) => {
                                    e.preventDefault()
                                    router.push(item.url)
                                  }
                                : undefined
                            }
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          )
        })}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
