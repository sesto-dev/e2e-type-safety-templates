// Static photo data integration (replacing Unsplash API)
import staticPhotos from "~/data/static-photos.json"

export interface UnsplashPhoto {
  id: string
  urls: {
    small: string
    regular: string
    full: string
  }
  alt_description: string | null
  user: {
    name: string
    username: string
    links: {
      html: string
    }
  }
  links: {
    html: string
    download: string
    download_location: string
  }
}

export interface UnsplashResponse {
  results: UnsplashPhoto[]
  total: number
  total_pages: number
}

export type PhotoTheme = "nature" | "travel" | "architecture"

export async function fetchPhotos(theme: PhotoTheme, count = 20): Promise<UnsplashPhoto[]> {
  // Get photos from static data based on theme
  const themePhotos = staticPhotos[theme] || []

  // Shuffle and take the requested count
  const shuffled = [...themePhotos].sort(() => Math.random() - 0.5)
  const selectedPhotos = shuffled.slice(0, Math.min(count, shuffled.length))

  // Return photos in the expected format
  return selectedPhotos.map((photo) => ({
    id: photo.id,
    urls: {
      small: photo.urls.small,
      regular: photo.urls.regular,
      full: photo.urls.full,
    },
    alt_description: photo.alt_description,
    user: {
      name: photo.user.name,
      username: photo.user.username,
      links: {
        html: photo.user.links.html,
      },
    },
    links: {
      html: photo.links.html,
      download: photo.links.download,
      download_location: photo.links.download_location,
    },
  }))
}

export async function triggerDownload(downloadUrl: string): Promise<void> {
  // For static photos, we don't need to trigger download tracking
  // This maintains compatibility with existing code
  return Promise.resolve()
}
