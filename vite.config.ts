import { defineConfig } from "vite";
import path from "path";
import oxlintPlugin from "vite-plugin-oxlint";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    oxlintPlugin({
      configFile: "oxlintrc.json",
    }),
    tailwindcss()
  ],
  assetsInclude: ["assets/root.css", "**/*/*.ttf"],
  base: "/",
  build: {
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core/"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@polyfills": path.resolve(__dirname, "./src/core/polyfills/index.ts"),
      "process": path.resolve(__dirname, "./src/core/polyfills/process.ts"),
      "perf_hooks": path.resolve(__dirname, "./src/core/polyfills/performance.ts"),
      "url": path.resolve(__dirname, "./src/core/polyfills/url.ts"),
      "buffer": path.resolve(__dirname, "./src/core/polyfills/buffer.ts"),
      "stream": path.resolve(__dirname, "./src/core/polyfills/stream.ts"),
      "net": path.resolve(__dirname, "./src/core/polyfills/net.ts"),
      "util": path.resolve(__dirname, "./src/core/polyfills/util.ts"),
      "vm": path.resolve(__dirname, "./src/core/polyfills/vm.ts"),
      "crypto": path.resolve(__dirname, "./src/core/polyfills/crypto.ts")
    },
  },
  preview: {
    port: 5550,
  },
  optimizeDeps: {
    include: ['whatwg-encoding', 'whatwg-mimetype', 'css.escape', 'iconv-lite'],
    exclude: ['happy-dom']
  },
  ssr: {
    noExternal: ['happy-dom', 'whatwg-encoding', 'whatwg-mimetype', 'css.escape', 'iconv-lite']
  }
});
