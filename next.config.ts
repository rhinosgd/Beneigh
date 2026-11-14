import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        // 图片/字体等静态资源：允许浏览器长缓存，避免每次打开都重新向服务器校验
        source: "/:path*\\.:ext(svg|webp|png|jpg|jpeg|avif|gif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
