export const siteUrl = process.env.NEXT_PUBLIC_APP_URL;

export const siteConfig = () => ({
  name: "Template",
  url: siteUrl,
  ogImage: `${siteUrl}/opengraph-image`,
  description: "All your organization's health needs.",
  links: {
    twitter: "https://twitter.com/sesto-dev",
    github: "https://github.com/sesto-dev",
  },
});

export type SiteConfig = typeof siteConfig;
