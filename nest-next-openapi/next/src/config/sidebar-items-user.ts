import { NavItem } from '~/types'

export const navItems: NavItem[] = [
  {
    title: 'Home',
    url: '/admin',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
  },
  {
    title: 'User Profile',
    url: '#',
    icon: 'billing',
    isActive: true,
    items: [
      {
        title: 'Notifications',
        url: '/admin/user/notifications',
        icon: 'warning',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Referrals',
        url: '/admin/user/referrals',
        icon: 'edit',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Payments',
        url: '/admin/user/payments',
        icon: 'edit',
        shortcut: ['m', 'm'],
      },
      {
        title: 'Edit Profile',
        url: '/admin/user/edit',
        icon: 'edit',
        shortcut: ['m', 'm'],
      },
    ],
  },
]
