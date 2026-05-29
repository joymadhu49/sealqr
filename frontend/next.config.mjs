/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Zama relayer SDK ships WASM and expects browser globals. Keep it out of
  // server bundles and enable async WebAssembly on the client.
  webpack: (config, { isServer }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };
    // pino-pretty is an optional dev logger pulled transitively by wallet libs.
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
    };
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    }
    return config;
  },
};

export default nextConfig;
