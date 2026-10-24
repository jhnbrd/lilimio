import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
let revision = process.env.APP_BUILD_SHA || "unknown";
if (revision === "unknown") {
  try {
    revision = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (
      execFileSync(
        "git",
        ["status", "--porcelain", "--untracked-files=normal"],
        { encoding: "utf8" },
      ).trim()
    )
      revision += "-dirty";
  } catch {
    /* Source archives may omit Git. */
  }
}
const buildInfo = { version, revision, builtAt: new Date().toISOString() };
export default defineConfig({
  define: { __BUILD_INFO__: JSON.stringify(buildInfo) },
  publicDir: false,
  server: {
    proxy: {
      "/api/observations/": "http://127.0.0.1:8090",
      "/api/places/": "http://127.0.0.1:8090",
    },
  },
  preview: {
    proxy: {
      "/api/observations/": "http://127.0.0.1:8090",
      "/api/places/": "http://127.0.0.1:8090",
    },
  },
  plugins: [
    {
      name: "copy-runtime-public",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = decodeURIComponent((req.url || "").split("?")[0]);
          const root = resolve("public");
          const file = resolve(root, "." + pathname);
          if (file.startsWith(root + "\\") || file.startsWith(root + "/")) {
            if (existsSync(file) && statSync(file).isFile()) {
              const ext = file.split(".").pop();
              const types: Record<string, string> = {
                webp: "image/webp",
                png: "image/png",
                ico: "image/x-icon",
                woff2: "font/woff2",
                svg: "image/svg+xml",
              };
              res.setHeader(
                "Content-Type",
                types[ext || ""] || "application/octet-stream",
              );
              createReadStream(file).pipe(res);
              return;
            }
          }
          next();
        });
      },
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "build-info.json",
          source: JSON.stringify(buildInfo),
        });
        for (const file of [
          "art",
          "fonts",
          "images/brand/lilimio/png",
          "images/brand/lilimio/pwa",
          "images/brand/lilimio/apple",
          "images/brand/lilimio/favicon",
          "_redirects",
        ])
          cpSync(resolve("public", file), resolve("dist", file), {
            recursive: true,
          });
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: [],
      manifest: {
        name: "lilimio. — Know the heat. Find your shade.",
        short_name: "lilimio.",
        description:
          "Know the heat. Find your shade. A heat-awareness companion.",
        lang: "en-PH",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f7f6ef",
        theme_color: "#244d39",
        icons: [
          {
            src: "/images/brand/lilimio/pwa/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/images/brand/lilimio/pwa/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/images/brand/lilimio/pwa/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cacheId: "lilimio-react",
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        globPatterns: [
          "**/*.{js,css,html,woff2}",
          "art/{onboarding,guides,learn}.webp",
          "images/brand/lilimio/png/wordmark-640.png",
          "images/brand/lilimio/pwa/icon-{192,512}.png",
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === self.location.origin &&
              url.pathname.startsWith("/art/"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "lilimio-art-v1",
              expiration: { maxEntries: 12, maxAgeSeconds: 30 * 86400 },
            },
          },
        ],
        globIgnores: [
          "**/relief-map-*.js",
          "**/relief-map-*.css",
          "**/maplibre-gl-worker-*.js",
          "**/maplibre-gl-worker-*.css",
          "**/marketing/**",
          "**/masters/**",
          "**/source-prompts/**",
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
