/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'thewholetruthfoods.com' },
      { protocol: 'https', hostname: 'beminimalist.co' },
      { protocol: 'https', hostname: 'whatsupwellness.in' },
      { protocol: 'https', hostname: 'kapiva.in' },
      { protocol: 'https', hostname: 'sleepyowl.co' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'nothing.tech' },
      { protocol: 'https', hostname: 'bluetokaicoffee.com' },
      { protocol: 'https', hostname: 'snitch.co.in' },
      { protocol: 'https', hostname: 'mcaffeine.com' },
      { protocol: 'https', hostname: 'yogabars.in' },
      { protocol: 'https', hostname: 'images.yourstory.com' },
      { protocol: 'https', hostname: 'gonoise.com' },
      { protocol: 'https', hostname: 'www.boat-lifestyle.com' },
      { protocol: 'https', hostname: 'images.seeklogo.com' },
      { protocol: 'https', hostname: 'www.jiomart.com' },
      { protocol: 'https', hostname: 'www.bbassets.com' },
      { protocol: 'https', hostname: 'media.thewholetruthfoods.com' },
      { protocol: 'https', hostname: 'images-static.nykaa.com' },
      { protocol: 'https', hostname: 'cdn.zeptonow.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      { protocol: 'https', hostname: 'cdn.brandfetch.io' },
      { protocol: 'https', hostname: 'img-cdn.publive.online' },
      { protocol: 'https', hostname: 'www.mediainfoline.com' }
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes globally to unblock external AI bots
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ];
  }
}

module.exports = nextConfig
