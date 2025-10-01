import { NavItem } from "~/types";

export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/admin",
    icon: "dashboard",
    isActive: false,
    shortcut: ["d", "d"],
    items: [],
  },
  {
    title: "Assets",
    url: "#",
    icon: "billing",
    isActive: true,
    items: [
      {
        title: "Subscriptions",
        url: "/admin/assets/subscriptions",
        icon: "warning",
        shortcut: ["m", "m"],
      },
    ],
  },
  {
    title: "User Profile",
    url: "#",
    icon: "billing",
    isActive: true,
    items: [
      {
        title: "Notifications",
        url: "/admin/user/notifications",
        icon: "warning",
        shortcut: ["m", "m"],
      },
      {
        title: "Referrals",
        url: "/admin/user/referrals",
        icon: "edit",
        shortcut: ["m", "m"],
      },
      {
        title: "Payments",
        url: "/admin/user/payments",
        icon: "edit",
        shortcut: ["m", "m"],
      },
      {
        title: "Edit Profile",
        url: "/admin/user/edit",
        icon: "edit",
        shortcut: ["m", "m"],
      },
    ],
  },
  {
    title: "Support",
    url: "#",
    icon: "billing",
    isActive: false,
    items: [
      {
        title: "FAQ",
        url: "/admin/support/faq",
        icon: "warning",
        shortcut: ["m", "m"],
      },
      {
        title: "Tickets",
        url: "/admin/support/tickets",
        icon: "warning",
        shortcut: ["m", "m"],
      },
      {
        title: "Contact Us",
        url: "/admin/support/contact",
        icon: "edit",
        shortcut: ["m", "m"],
      },
      {
        title: "Terms of Service",
        url: "/legal/tos",
        icon: "edit",
        shortcut: ["m", "m"],
      },
      {
        title: "Privacy Policies",
        url: "/legal/privacy",
        icon: "edit",
        shortcut: ["m", "m"],
      },
    ],
  },
];
