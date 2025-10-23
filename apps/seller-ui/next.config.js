//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require("@nx/next");
const path = require("path");

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  images: {
    remotePatterns: [{ hostname: "ik.imagekit.io" }],
  },

  webpack: (config) => {
    config.resolve.alias["@packages"] = path.resolve(
      __dirname,
      "../../packages"
    );
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
