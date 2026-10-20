import { defineConfig } from "vite";
import { cpSync } from "node:fs";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  publicDir: false,
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
        description: "A Philippine heat-awareness companion.",
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
        globPatterns: ["**/*.{js,css,html,woff2,webp,png,ico}"],
        globIgnores: [
          "**/marketing/**",
          "**/masters/**",
          "**/source-prompts/**",
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
