import { NavItem } from '~/types'

export const navItems: NavItem[] = [
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
  },
  {
    title: 'Panels',
    url: '#',
    icon: 'billing',
    isActive: true,
    items: [
      {
        title: 'Users',
        url: '/admin/users',
        icon: 'user',
        shortcut: ['e', 'e'],
        isActive: false,
        items: [],
      },
    ],
  },
]
