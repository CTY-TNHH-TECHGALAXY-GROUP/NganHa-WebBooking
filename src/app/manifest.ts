import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Oria Spa',
    short_name: 'Oria Spa',
    description: 'Premium Spa in District 1, HCMC',
    start_url: '/',
    display: 'standalone',
    background_color: '#281b15',
    theme_color: '#281b15',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
