let userConfig = undefined
try {
  // try to import ESM first
  userConfig = await import('./v0-user-next.config.mjs')
} catch (e) {
  try {
    // fallback to CJS import
    userConfig = await import("./v0-user-next.config");
  } catch (innerError) {
    // ignore error
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to avoid React Three Fiber issues
  images: {
    domains: ['localhost', '127.0.0.1', 'via.placeholder.com', 'placehold.co', 'blob.v0.dev'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle three.js and react-three-fiber compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Handle ESM modules for Three.js
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    })

    // Handle .glb and .gltf files
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]'
      }
    })

    // Optimize Three.js
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': 'three',
      'three/examples/jsm': 'three/examples/jsm'
    }

    return config
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
}

if (userConfig) {
  // ESM imports will have a "default" property
  const config = userConfig.default || userConfig

  for (const key in config) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...config[key],
      }
    } else {
      nextConfig[key] = config[key]
    }
  }
}

export default nextConfig
